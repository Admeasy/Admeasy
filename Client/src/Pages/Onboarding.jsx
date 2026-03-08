import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { Check, Search, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import school from "../assets/Icons/school.svg";
import college from "../assets/Icons/college.svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { IoIosArrowBack } from "react-icons/io";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import { Controller } from "react-hook-form";
import CityInput from "../components/CityInput";
import { MapPin, Navigation } from "lucide-react";

// --- VALIDATION SCHEMAS ---

// Step 1: Name, Email, Phone
const step1Schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  city: z.string().min(2, "Enter your city"),
});

// Step 2: Username, Password
const step2Schema = (requirePassword = false, requireUsername = false) =>
  z.object({
    ...(requirePassword
      ? {
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Za-z]/, "Password must contain a letter")
          .regex(/[0-9]/, "Password must contain a number")
          .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
      }
      : {}),
    ...(requireUsername
      ? {
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be at most 20 characters")
          .regex(/^[a-z0-9_]+$/, "Lowercase, numbers & underscore only"),
      }
      : {}),
  });

// Step 3: Education Type & Institute Selection
const step3Schema = z
  .object({
    educationType: z.enum(["school", "college"], {
      errorMap: () => ({ message: "Please select school or college" }),
    }),
    board: z.string().optional(),
    universityName: z.string().optional(),
    isNotAffiliated: z.boolean().optional(),
    manualInstituteName: z.string().optional(),
  });

// Step 4: Academic Details (School)
const schoolSchema = z
  .object({
    class: z.string().min(1, "Please select your class"),
    stream: z.string().optional(),
  })
  .refine(
    (data) =>
      !(data.class === "11th" || data.class === "12th") || !!data.stream,
    { path: ["stream"], message: "Stream is required for Class 11th and 12th" },
  );

// Step 4: Academic Details (College)
const collegeSchema = z.object({
  courseLevel: z.string().min(1, "Select course level"),
  courseDetails: z.string().min(3, "Enter your course details"),
});

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, fetchUser, isLoading } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    name: "",
    phone: "",
    city: "",
  });
  const [educationType, setEducationType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [usernameMessage, setUsernameMessage] = useState("");

  const checkUsernameAvailability = useCallback(async (val) => {
    if (!val || val.length < 3) {
      setUsernameStatus("invalid");
      setUsernameMessage("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(val)) {
      setUsernameStatus("invalid");
      setUsernameMessage("Lowercase, numbers & underscore only");
      return;
    }

    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/check-username/${val}`);
      const data = await res.json();
      if (data.available) {
        setUsernameStatus("available");
        setUsernameMessage("Username is available!");
      } else {
        setUsernameStatus("taken");
        setUsernameMessage("Username is already taken");
      }
    } catch (err) {
      console.error("Check username error:", err);
      setUsernameStatus("idle");
    }
  }, []);

  const debouncedCheck = useMemo(() => {
    let timeout;
    return (val) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => checkUsernameAvailability(val), 500);
    };
  }, [checkUsernameAvailability]);

  useEffect(() => {
    const checkOnboardingAccess = async () => {
      try {
        const res = await fetch("/api/users/onboarding/status", {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.requiresOnboarding && data.hasCompletedOnboarding) {
          toast.info("You have already completed onboarding");
          navigate("/");
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
      }
    };
    checkOnboardingAccess();
  }, [navigate]);

  const getCurrentSchema = () => {
    if (step === 1) return step1Schema;
    if (step === 2) return step2Schema(!user, !user?.username);
    if (step === 3) return step3Schema;
    if (step === 4) {
      if (educationType === "school") return schoolSchema;
      if (educationType === "college") return collegeSchema;
      throw new Error("Education type missing");
    }
    throw new Error(`No schema found for step ${step}`);
  };

  const schema = useMemo(() => getCurrentSchema(), [step, user, educationType]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: useRef(formData).current,
    mode: "onChange",
    shouldUnregister: false,
  });

  useEffect(() => {
    if (!isLoading && user) {
      const userDefaults = {
        email: user.email || "",
        username: user.username || "",
        name: user.name || "",
        city: user.city || "",
      };
      setFormData((prev) => ({ ...userDefaults, ...prev }));
      form.reset({ ...form.getValues(), ...userDefaults });
    }
  }, [user, isLoading, form]);

  useEffect(() => {
    form.clearErrors();
  }, [user, form]);

  const onSubmit = async (data) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    if (step === 3) {
      setEducationType(data.educationType);
      setStep(4);
    } else if (step === 4) {
      setIsSubmitting(true);
      try {
        const onboardingData = {
          ...updatedData,
          phone: String(updatedData.phone || ""),
          email: user?.email || updatedData.email,
          password: user ? undefined : updatedData.password,
          universityName: updatedData.isNotAffiliated
            ? updatedData.manualInstituteName || null
            : updatedData.universityName || null,
          board: updatedData.board || null,
          class: updatedData.class || null,
          stream: updatedData.stream || null,
        };

        console.log("Onboarding Payload:", onboardingData);

        // Debug logging for missing required fields based on educationType
        const requiredCore = ["name", "email", "city", "phone", "username", "educationType"];
        requiredCore.forEach(field => {
          if (!onboardingData[field]) console.warn("Missing core field:", field);
        });

        if (onboardingData.educationType === "college") {
          const requiredCollege = ["courseLevel", "courseDetails"];
          requiredCollege.forEach(field => {
            if (!onboardingData[field]) console.warn("Missing college field:", field);
          });
        } else if (onboardingData.educationType === "school") {
          if (!onboardingData.class) console.warn("Missing school field: class");
        }

        const res = await fetch("/api/users/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(onboardingData),
          credentials: "include",
        });

        const result = await res.json();
        if (res.ok) {
          toast.success("🎉 Onboarding Complete!");
          await fetchUser();
          navigate("/");
        } else {
          toast.error(result.message || "Failed to complete onboarding");
        }
      } catch (err) {
        console.error("Onboarding error:", err);
        toast.error("Network error. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (step === 2 && !user?.username && usernameStatus !== "available" && updatedData.username) {
        toast.error("Please choose an available username");
        return;
      }
      setStep((prev) => prev + 1);
    }
  };

  const onBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      if (step === 4) setEducationType(null);
    }
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <form>
              <div className="space-y-6">
                {step === 1 && <Step1 form={form} />}
                {step === 2 && (
                  <Step2
                    form={form}
                    debouncedCheck={debouncedCheck}
                    usernameStatus={usernameStatus}
                    usernameMessage={usernameMessage}
                  />
                )}
                {step === 3 && <Step3 form={form} />}
                {step === 4 && educationType === "college" && (
                  <Step4College form={form} />
                )}
                {step === 4 && educationType === "school" && (
                  <Step4School form={form} />
                )}

                <div className="flex justify-between items-center pt-6">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <IoIosArrowBack size={20} />
                      Back
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : step === 4
                        ? "Complete"
                        : "Continue"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- HELPER COMPONENT FOR UNIVERSITY SEARCH ---
function UniversityInput({ register, setValue, watch, error }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputValue = watch("universityName") || "";

  useEffect(() => {
    const fetchUniversities = async () => {
      if (!inputValue || inputValue.length < 1) {
        setSuggestions([]);
        return;
      }

      if (!showSuggestions) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `http://universities.hipolabs.com/search?name=${inputValue}&country=India`,
        );
        setSuggestions(response.data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching universities:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUniversities, 400);
    return () => clearTimeout(timer);
  }, [inputValue, showSuggestions]);

  const handleSelect = (name) => {
    setValue("universityName", name, { shouldValidate: true });
    setShowSuggestions(false);
  };

  const handleChange = (e) => {
    setValue("universityName", e.target.value, { shouldValidate: true });
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Enter Your University
      </label>
      <div className="relative">
        <input
          {...register("universityName")}
          onChange={handleChange}
          onBlur={handleBlur}
          type="text"
          placeholder="Search or type manually..."
          className="w-full border-2 border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 outline-none transition"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Loading...
            </div>
          ) : (
            suggestions.map((uni, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(uni.name)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 transition-colors"
              >
                {uni.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// --- STEPS COMPONENTS ---

function Step1({ form }) {
  const { register, formState, control, setValue } = form;
  const { errors } = formState;
  const { user } = useUser();
  const [detecting, setDetecting] = useState(false);
  const [showDeniedModal, setShowDeniedModal] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = import.meta.env.VITE_GEOLOCATION_API_KEY;

          // Using OpenWeatherMap Reverse Geocoding API
          const response = await axios.get(
            `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
          );

          if (response.data && response.data.length > 0) {
            const result = response.data[0];

            // Filter for India
            if (result.country && result.country !== 'IN') {
              toast.error("Admeasy is currently available only in India 🇮🇳");
              return;
            }

            const city = result.name || result.local_names?.en;
            if (city) {
              setValue("city", city, { shouldValidate: true });
              toast.success(`📍 Located ${city}`);
            } else {
              toast.error("Could not verify city name. Please enter manually.");
            }
          } else {
            // Fallback or handle empty result
            toast.error("Could not find city. Please enter manually.");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast.error("Location detection failed. Please enter manually."); // Fallback
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setDetecting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setShowDeniedModal(true);
        } else {
          toast.error("Location detection failed. Please retry or enter manually.");
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Basic Information
        </h2>
        <p className="text-gray-600">Let's start with your details ✨</p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Your Name
        </label>
        <input
          id="name"
          type="text"
          {...register("name", { required: "Please enter your name" })}
          placeholder="Enter your full name"
          className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="your.email@example.com"
          disabled={!!user?.email}
          className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-600"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <div className="flex">
          <span className="flex items-center justify-center px-3 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-600 text-sm">
            +91
          </span>
          <input
            {...register("phone")}
            type="number"
            placeholder="Phone number"
            className="flex-1 border border-gray-300 rounded-r-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <CityInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.city}
                  placeholder="Enter your city"
                />
              )}
            />
          </div>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="flex items-center justify-center p-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Detect my location"
          >
            {detecting ? (
              <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Navigation size={20} className={detecting ? "animate-pulse" : ""} />
            )}
          </button>
        </div>
      </div>

      <LocationDeniedModal
        isOpen={showDeniedModal}
        onClose={() => setShowDeniedModal(false)}
        onAllow={() => {
          setShowDeniedModal(false);
          handleDetectLocation();
        }}
      />
    </div>
  );
}

function LocationDeniedModal({ isOpen, onClose, onAllow }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 transform transition-all m-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <MapPin size={32} className="text-red-500" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Location Access Needed
            </h3>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              We only use your location to improve college recommendations. Your data is private.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <button
              onClick={onAllow}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Allow Location Access
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Enter City Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2({ form, debouncedCheck, usernameStatus, usernameMessage }) {
  const { register, formState, setValue } = form;
  const { errors } = formState;
  const { user } = useUser();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🔐 Account Setup
        </h2>
        <p className="text-gray-600">Secure your account 🛡️</p>
      </div>

      {(!user || !user.username) && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Username
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400 font-bold text-xl">
              @
            </span>
            <input
              {...register("username")}
              type="text"
              placeholder="username"
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/\s/g, "");
                setValue("username", val, { shouldValidate: true });
                debouncedCheck(val);
              }}
              className={`w-full border-2 rounded-lg p-3 pl-11 focus:ring-2 outline-none transition ${usernameStatus === "available"
                ? "border-green-400 focus:ring-green-400"
                : usernameStatus === "taken" || usernameStatus === "invalid"
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-500"
                }`}
            />
          </div>
          {usernameMessage && (
            <p
              className={`mt-1 text-xs font-semibold ${usernameStatus === "available"
                ? "text-green-600"
                : usernameStatus === "taken" || usernameStatus === "invalid"
                  ? "text-red-600"
                  : "text-gray-500"
                }`}
            >
              {usernameMessage}
            </p>
          )}
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">
              {errors.username.message}
            </p>
          )}
        </div>
      )}

      {!user && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Create a password"
              className="w-full border-2 border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FaEyeSlash size={24} /> : <FaEye size={24} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters, contain a letter, number, and special
            character
          </p>
        </div>
      )}
    </div>
  );
}

// Step 3: Education Type & University Input (Combined Logic)
function Step3({ form }) {
  const { setValue, watch, formState, register } = form;
  const { errors } = formState;
  const selectedType = watch("educationType");
  const selectedBoard = watch("board");
  // Watch the "Not Affiliated" state
  const isNotAffiliated = watch("isNotAffiliated");

  const boards = ["CBSE", "ICSE", "State Board"];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🎓 Education Background
        </h2>
        <p className="text-gray-600">
          Are you currently in school or college? 🏫
        </p>
      </div>

      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => {
            setValue("educationType", "school");
            // RESET 'isNotAffiliated' so school doesn't see manual input
            setValue("isNotAffiliated", false);
          }}
          className={`flex flex-col items-center gap-4 p-8 rounded-xl border-2 transition-all ${selectedType === "school"
            ? "border-blue-500 bg-blue-50 text-blue-600 shadow-lg"
            : "border-gray-300 hover:border-gray-400 text-gray-600 hover:shadow-md"
            }`}
        >
          <img src={school} className="w-22" alt="School" />
          <span className="text-xl font-semibold">School</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setValue("educationType", "college");
            // Optional: reset if you want, or keep previous state
            setValue("isNotAffiliated", false);
          }}
          className={`flex flex-col items-center gap-4 p-8 rounded-xl border-2 transition-all ${selectedType === "college"
            ? "border-blue-500 bg-blue-50 text-blue-600 shadow-lg"
            : "border-gray-300 hover:border-gray-400 text-gray-600 hover:shadow-md"
            }`}
        >
          <img src={college} className="w-22" alt="College" />
          <span className="text-xl font-semibold">College</span>
        </button>
      </div>
      {errors.educationType && (
        <p className="text-red-500 text-sm text-center mt-2">
          {errors.educationType.message}
        </p>
      )}

      {/* Logic for Input Fields */}
      {selectedType && (
        <div className="mt-8 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* CONDITIONAL RENDERING BASED ON BUTTON CLICK */}
          {isNotAffiliated ? (
            // MANUAL INPUT MODE
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Institute Name Manually
              </label>
              <input
                {...register("manualInstituteName")}
                placeholder={`Enter your ${selectedType} name`}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
              {errors.manualInstituteName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.manualInstituteName.message}
                </p>
              )}
            </div>
          ) : (
            // STANDARD MODE (Boards or Search)
            <div>
              {selectedType === "school" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Select Your Board
                  </label>
                  <div className="flex flex-wrap justify-center gap-4">
                    {boards.map((board) => (
                      <button
                        key={board}
                        type="button"
                        onClick={() => setValue("board", board)}
                        className={`px-6 py-3 rounded-full border-2 font-medium transition-all duration-300 ${selectedBoard === board
                          ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105"
                          : "border-gray-300 text-gray-700 hover:bg-blue-50"
                          }`}
                      >
                        {board}
                      </button>
                    ))}
                  </div>
                  {errors.board && (
                    <p className="text-red-500 text-sm text-center mt-3">
                      {errors.board.message}
                    </p>
                  )}
                </div>
              )}

              {selectedType === "college" && (
                <UniversityInput
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  error={errors.universityName}
                />
              )}
            </div>
          )}

          {/* The "Not Affiliated" Button Logic - ONLY FOR COLLEGE */}
          {selectedType === "college" && (
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setValue("isNotAffiliated", !isNotAffiliated)}
                className="text-sm text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
              >
                {isNotAffiliated ? "Affiliated?" : "If Not Affiliated?"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Step4School({ form }) {
  const { register, watch, formState } = form;
  const { errors } = formState;

  const classes = ["6th", "7th", "8th", "9th", "10th", "11th", "12th"];
  const selectedClass = watch("class");

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🏫 School Details
        </h2>
        <p className="text-gray-600">Final steps 🚀</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Your Class
        </label>
        <select
          {...register("class")}
          className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
        >
          <option value="">Choose your class</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>
              Class {cls}
            </option>
          ))}
        </select>
        {errors.class && (
          <p className="text-red-500 text-sm mt-1">{errors.class.message}</p>
        )}
      </div>

      {(selectedClass === "11th" || selectedClass === "12th") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Your Stream ✨
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Science", "Commerce", "Arts"].map((stream) => (
              <button
                key={stream}
                type="button"
                onClick={() =>
                  form.setValue("stream", stream, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                className={`relative rounded-xl p-4 border-2 transition-all ${watch("stream") === stream ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-blue-200"}`}
              >
                <span className="font-bold">{stream}</span>
                {watch("stream") === stream && (
                  <Check className="absolute top-2 right-2 w-4 h-4" />
                )}
              </button>
            ))}
          </div>
          <input
            type="hidden"
            {...register("stream", { required: "Please select your stream" })}
          />
          {errors.stream && (
            <p className="text-red-500 text-sm mt-2">{errors.stream.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Step4College({ form }) {
  const { register, formState } = form;
  const { errors } = formState;
  const courseLevels = [
    "Diploma",
    "Post Diploma",
    "Graduation",
    "Post Graduation",
    "Doctorate",
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🏛️ College Details
        </h2>
        <p className="text-gray-600">Almost done 🎉</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Level
        </label>
        <select
          {...register("courseLevel")}
          className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
        >
          <option value="">Select course level</option>
          {courseLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        {errors.courseLevel && (
          <p className="text-red-500 text-sm mt-1">
            {errors.courseLevel.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Details
        </label>
        <input
          {...register("courseDetails")}
          placeholder="E.g., B.Tech. in Mechanical Engg. 2nd year"
          className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
        {errors.courseDetails && (
          <p className="text-red-500 text-sm mt-1">
            {errors.courseDetails.message}
          </p>
        )}
      </div>
    </div>
  );
}
