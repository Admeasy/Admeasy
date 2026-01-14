import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaChevronUp } from "react-icons/fa";
import axios from "axios";
import { Check, Search, X } from 'lucide-react';

import SmartSearchInput from "../components/SmartSearchInput";
import { Controller, useForm, Watch } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import male from '../assets/Icons/male.svg'
import female from "../assets/Icons/femenine.svg"
import other from "../assets/Icons/transition.svg"
import school from "../assets/Icons/school.svg"
import college from "../assets/Icons/college.svg"
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { IoIosArrowBack } from "react-icons/io";
import { FaMale, FaFemale, FaTransgender, FaUser } from "react-icons/fa";
import { MdSchool, MdCastle } from "react-icons/md";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import {
  Atom,
  Calculator,
  Palette,
  Scale,
  LineChart,
  BookOpen,
  Microscope,
  Briefcase,
  History,
  Theater,
} from "lucide-react"; // lightweight beautiful icons


// exams List 
const examsList = [
  "CUET",
  "JEE",
  "NEET UG",
  "CLAT",
  "UPSC",
  "IPMAT",
  "CAT",
  "CA FOUNDATION",
  "CA INTERMEDIATE",
  "CA FINAL",
  "CFA L1",
  "CFA L2",
  "CFA L3",
  "PAT",
  "AILET",
  "SLAT",
  "NPAT",
  "SET",
  "CUET (Christ University)",
  "St. Xavier Entrance Test",
  "AIIMS NURSING",
  "ICAR AIEEA",
  "NEET PG",
  "GATE",
  "SAT (abroad)",
  "ACT (abroad)",
  "CEED (PG for Design)",
  "UCEED (UG for Design)",
  "CLAT PG",
  "LSAT - India",
  "MH CET",
  "STATE CIVIL SERVICES",
  "AMU BA LLB ENTRANCE",
  "CUET - PG",
  "AILET - PG",
  "XAT",
  "NMAT",
  "SNAP",
  "MAT",
  "CMAT",
  "ATMA",
  "GMAT",
  "TISS-NET",
  "MICAT",
  "UPSEE",
  "MAH-MCA MET",
  "NIMCET",
  "JAM",
  "JEST",
  "GATE (economics in IIT Delhi/IIT Bombay)",
  "CS (CSEET)",
  "CS Executive Exam (Module I & II)",
  "CS Professional Exam (Module I, II & III)",
  "ACCA",
  "CMA FOUNDATION",
  "CMA INTERMEDIATE",
  "CMA FINAL",
  "SSC",
  "FRM (Financial Risk Manager)",
  "CUET UG (Science)",
  "CUET UG (Maths)",
  "CUET UG (Commerce)",
  "CUET UG (Arts)",
  "CUET UG (Law)",
];


// Validation Schemas
const step1Schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  gender: z.string().min(1, "Please select your gender"),
});


const step2Schema = z.object({
  languages: z
    .array(z.string())
    .min(1, "Please select at least one language"),
  city: z
    .string()
    .min(2, "City name is too short")
    .max(50, "City name is too long"),
});


const step3Schema = (requirePassword = false, requireUsername = false) => z.object({
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  ...(requirePassword ? {
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain a letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character")
  } : {}),
  ...(requireUsername ? {
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-z0-9_]+$/, "Lowercase, numbers & underscore only")
  } : {})
});




export const step4Schema = z
  .object({
    educationType: z.enum(["school", "college"], {
      errorMap: () => ({ message: "Please select school or college" }),
    }),
    board: z.string().optional(),
    universityName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // if school, board must be filled
    if (data.educationType === "school" && !data.board?.trim()) {
      ctx.addIssue({
        path: ["board"],
        message: "Please select your board",
      });
    }

    // if college, universityName must be filled
    if (data.educationType === "college" && !data.universityName?.trim()) {
      ctx.addIssue({
        path: ["universityName"],
        message: "Please enter your university name",
      });
    }
  });
const schoolSchema = z
  .object({
    class: z.string().min(1, "Please select your class"),
    stream: z.string().optional(),
    schoolName: z.string().min(2, "Enter your school name"),
  })
  .refine(
    (data) =>
      !(data.class === "11th" || data.class === "12th") || !!data.stream,
    { path: ["stream"], message: "Stream is required for Class 11th and 12th" }
  );

const collegeSchema = z.object({
  courseLevel: z.string().min(1, "Select course level"),
  courseDetails: z.string().min(3, "Enter your course details"),
  collegeName: z.string().min(2, "Please enter your college name"),
});

const step6CollegeSchema = z.object({
  examsPreparingFor: z
    .array(z.enum(examsList))
    .optional()
    .default([]),

  reasonForAdmeasy: z
    .enum(
      [
        "Just Exploring",
        "Finding Mentorship",
        "Switching College or Course",
        "Internship or Placement Opportunities",
        "Scholarship",
      ],
      {
        errorMap: () => ({
          message: "Please select what brings you to Admeasy",
        }),
      }
    ),

  reasonForAdmeasyInput: z
    .string()
    .max(200, "You can enter up to 200 characters only")
    .optional(),
});

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, fetchUser, isLoading } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    name: "",
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


  // Check if user can access onboarding on mount
  useEffect(() => {
    const checkOnboardingAccess = async () => {
      try {
        const res = await fetch('/api/users/onboarding/status', {
          credentials: 'include'
        });
        const data = await res.json();
        if (!data.canAccess) {
          // User has already completed onboarding, redirect to home
          toast.info('You have already completed onboarding');
          navigate('/');
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      }
    };
    checkOnboardingAccess();
  }, [navigate]);
  const getCurrentSchema = () => {
    if (step === 1) return step1Schema;
    if (step === 2) return step2Schema;
    if (step === 3) return step3Schema(!user, !user?.username);
    if (step === 4) return step4Schema;

    if (step === 5) {
      if (educationType === "school") return schoolSchema;
      if (educationType === "college") return collegeSchema;
      throw new Error("Education type missing at step 5");
    }

    if (step === 6) {
      if (educationType === "college") return step6CollegeSchema;
      if (educationType === "school") return step6CollegeSchema;
      throw new Error("Education type missing at step 6");
    }

    throw new Error(`No schema found for step ${step}`);
  };
  const schema = useMemo(() => getCurrentSchema(), [step, user, educationType]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: useRef(formData).current,
    mode: 'onChange',
    shouldUnregister: false,
  });

  // Sync user data into formData when it loads
  useEffect(() => {
    if (!isLoading && user) {
      const userDefaults = {
        email: user.email || "",
        username: user.username || "",
        name: user.name || "",
      };

      // Only update if current formData is largely empty (initial load)
      setFormData(prev => ({
        ...userDefaults,
        ...prev
      }));

      // Update form values
      form.reset({
        ...form.getValues(),
        ...userDefaults
      });
    }
  }, [user, isLoading, form]);

  // Update form schema when user state changes (for password requirement)
  useEffect(() => {
    form.clearErrors();
  }, [user, form]);

  const onSubmit = async (data) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    if (step === 4) {
      setEducationType(data.educationType);
      setStep(5);
    }
    else if (
      (educationType === "school" && step === 6) ||
      (educationType === "college" && step === 6)
    ) {
      // Send data to backend
      setIsSubmitting(true);
      try {
        // Prepare data for backend
        const onboardingData = {
          ...updatedData,
          // Ensure phone is a string if it's a number
          phone: String(updatedData.phone || ''),
          // Get email and password from user if logged in, or from form if not
          email: user?.email || updatedData.email,
          password: user ? undefined : updatedData.password // Only send password if creating new account
        };
        console.log(onboardingData)
        const res = await fetch('/api/users/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(onboardingData),
          credentials: 'include'
        });

        const result = await res.json();

        if (res.ok) {
          toast.success('🎉 Onboarding Complete!');
          console.log(onboardingData)
          await fetchUser(); // Refresh user context
          navigate('/');
        } else {
          toast.error(result.message || 'Failed to complete onboarding');
        }
      } catch (err) {
        console.error('Onboarding error:', err);
        toast.error('Network error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
    else {
      if (step === 3 && !user?.username && usernameStatus !== "available" && updatedData.username) {
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

  const totalSteps = 6;
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
        {/* Progress Bar */}
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
                {step === 2 && <Step2 form={form} />}
                {step === 3 && <Step3 form={form} debouncedCheck={debouncedCheck} usernameStatus={usernameStatus} usernameMessage={usernameMessage} />}
                {step === 4 && <Step4 form={form} />}
                {step === 5 && educationType === "college" && <Step5College form={form} />}
                {step === 5 && educationType === "school" && <Step5School form={form} />}
                {step === 6 && <Step6College form={form} />}
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
                    {isSubmitting ? "Saving..." : step === 6 ? "Complete" : "Continue"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );



  // Form page End

  // Step 1: Name & Gender
  function Step1({ form }) {
    const { register, setValue, watch, formState } = form;
    const { errors } = formState;

    const selectedGender = watch("gender");

    const genderOptions = useMemo(
      () => [
        { value: "male", label: "Male", icon: male },
        { value: "female", label: "Female", icon: female },
        { value: "other", label: "Other", icon: other },
      ],
      []
    );

    const handleGenderSelect = useCallback(
      (value) => {
        setValue("gender", value, { shouldValidate: true, shouldDirty: true });
      },
      [setValue]
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            Let's get to know you better
          </h2>
          <p className="text-gray-600">Tell us a bit about yourself</p>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name", { required: "Please enter your name" })}
            placeholder="Enter your full name"
            className={`w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.name ? "border-red-500" : "border-gray-300"
              }`}
            autoComplete="name"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p
              id="name-error"
              className="text-red-500 text-sm flex items-center gap-1"
              role="alert"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Gender Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <input type="hidden" {...register("gender", { required: true })} />
          <div
            className="grid grid-cols-3 gap-3"
            role="radiogroup"
            aria-label="Gender selection"
            aria-describedby={errors.gender ? "gender-error" : undefined}
          >
            {genderOptions.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleGenderSelect(value)}
                role="radio"
                aria-checked={selectedGender === value}
                aria-label={label}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedGender === value
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-300 hover:border-gray-400 text-gray-600"
                  }`}
              >
                <img src={icon} className="w-12" alt="" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
          {errors.gender && (
            <p
              id="gender-error"
              className="text-red-500 text-sm flex items-center gap-1"
              role="alert"
            >
              Please select a gender
            </p>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Languages & City
  function Step2({ form }) {
    const { register, formState, setValue, watch } = form;
    const { errors } = formState;
    const [debounceTimer, setDebounceTimer] = useState(null);
    const languages = [
      "Hindi",
      "English",
      "Bengali",
      "Telugu",
      "Marathi",
      "Tamil",
      "Gujarati",
      "Urdu",
      "Kannada",
      "Odia",
    ];
    const selectedLangs = watch("languages") || [];

    const toggleLanguage = (lang) => {
      const current = new Set(selectedLangs);
      if (current.has(lang)) current.delete(lang);
      else current.add(lang);
      setValue("languages", Array.from(current), { shouldValidate: true });
    };

    // 🏙️ City autocomplete logic
    const [query, setQuery] = useState("");
    const [searchCity, SetSearchCity] = useState(false)
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Watch the form's city value to keep query in sync
    const formCity = watch("city");

    useEffect(() => {
      if (formCity && formCity !== query) {
        setQuery(formCity);
      }
    }, [formCity]);

    useEffect(() => {
      const fetchCities = async () => {
        if (!query || query.trim().length < 1) {
          setSuggestions([]);
          return;
        }

        setLoading(true);
        try {
          const response = await axios.get(
            "https://wft-geo-db.p.rapidapi.com/v1/geo/cities",
            {
              params: { namePrefix: query, limit: 6, countryIds: 'IN' },
              headers: {
                "X-RapidAPI-Key": '6fa46a8610mshe02ec2fbdfecb4fp16267djsn02ca1ff6e44f',
                "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
              },
            }
          );
          const results = response.data.data.map((c) => c.city);
          setSuggestions(results);
        } catch (error) {
          console.error("Error fetching cities:", error);
        }
        setLoading(false);
      };

      const debounce = setTimeout(fetchCities, 300);
      return () => clearTimeout(debounce);
    }, [query]);

    const handleSelectCity = (city) => {
      setValue("city", city, { shouldValidate: true });
      setQuery(city);
      setSuggestions([]);
    };

    const handleInputChange = (e) => {
      const value = e.target.value;
      setQuery(value); // instantly reflect in UI

      // clear any previous timeout
      if (debounceTimer) clearTimeout(debounceTimer);

      // set a new timeout to update react-hook-form after delay
      const newTimer = setTimeout(() => {
        setValue("city", value, { shouldValidate: true });
      }, 2000);

      setDebounceTimer(newTimer);
    };


    return (
      <div className="space-y-8">
        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Preferences & Location
          </h2>
          <p className="text-gray-600">Tell us what suits you best ✨</p>
        </div>

        {/* 🌐 Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Languages You Prefer
          </label>
          <div className="flex flex-wrap gap-3">
            {languages.map((lang) => {
              const isActive = selectedLangs.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-5 py-2 rounded-full border-2 font-medium transition-all duration-300 ${isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105"
                    : "border-gray-300 text-gray-700 hover:bg-blue-50"
                    }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
          {errors.languages && (
            <p className="text-red-500 text-sm mt-2">
              {errors.languages.message}
            </p>
          )}
        </div>

        {/* 🏙️ City Input with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your City
          </label>
          {/* City Input */}
          <div className="relative w-full">
            <input
              {...register("city", { required: "City is required" })}
              value={query}
              onChange={handleInputChange}
              type="text"
              placeholder="Type your city..."
              className="w-full border-2 border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              autoComplete="off"
            />

            {/* Chevron Icon */}
            <button
              type="button"
              onClick={() => setSuggestions([])}
              className="h-full rounded-lg p-3 absolute bg-gray-100 right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-transform duration-300"
            >
              <FaChevronUp
                className={`transform transition-transform duration-300 ${suggestions.length > 0 ? "rotate-180 text-blue-600" : ""
                  }`}
                size={16}
              />
            </button>
          </div>
          {/* Loading */}
          {loading && (
            <p className="absolute top-full mt-1 text-sm text-gray-500 italic">
              Searching...
            </p>
          )}

          {/* Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-xl shadow-xl max-h-52 overflow-y-auto animate-fadeIn">
              {suggestions.map((city, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectCity(city)}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  {city}
                </div>
              ))}
            </div>
          )}

          {errors.city && (
            <p className="text-red-500 text-sm mt-2">{errors.city.message}</p>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Email & Phone passwords
  function Step3({ form, debouncedCheck, usernameStatus, usernameMessage }) {
    const { register, formState, unregister, setValue, getValues } = form;
    const { errors } = formState;
    const { user } = useUser();
    const [showPassword, setShowPassword] = useState(false);
    if (user?.email) {
      setValue("email", user.email, { shouldValidate: false });
    }


    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Contact Information
          </h2>
          <p className="text-gray-600">How can we reach you?</p>
        </div>

        {/* EMAIL FIELD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            {...register("email")}
            type="email"
            autoComplete="username"
            placeholder="your.email@example.com"
            disabled={!!user?.email}
            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-600"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* PHONE FIELD */}
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
              className="flex-1 border border-gray-300 rounded-r-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* PASSWORD FIELD (Only if user is not logged in yet) */}
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
                className="w-full border-2 border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />

              {/* 👁️ Eye Toggle Icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash size={24} /> : <FaEye size={24} />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters, contain a letter, number, and special
              character
            </p>
          </div>
        )}

        {/* USERNAME FIELD (Only if username is missing) */}
        {(!user || !user.username) && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 font-bold text-xl">@</span>
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
              <p className={`mt-1 text-xs font-semibold ${usernameStatus === "available" ? "text-green-600" :
                (usernameStatus === "taken" || usernameStatus === "invalid") ? "text-red-600" : "text-gray-500"
                }`}>
                {usernameMessage}
              </p>
            )}
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>
        )}



      </div>
    );
  }


  // Step 4: School or Collegeimport React from "react";


  function Step4({ form }) {
    const { setValue, watch, formState, register } = form;
    const { errors } = formState;
    const selectedType = watch("educationType");
    const selectedBoard = watch("board");

    const boards = ["CBSE", "ICSE", "State Board"];
    const registerUnviersity = { ...register("universityName") }
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Your Educational Background
          </h2>
          <p className="text-gray-600">Are you currently in school or college?</p>
        </div>

        {/* Education Type Buttons */}
        <div className="grid grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setValue("educationType", "school")}
            className={`flex flex-col items-center gap-4 p-8 rounded-xl border-2 transition-all ${selectedType === "school"
              ? "border-blue-500 bg-blue-50 text-blue-600 shadow-lg"
              : "border-gray-300 hover:border-gray-400 text-gray-600 hover:shadow-md"
              }`}
          >
            <img src={school} className="w-22" alt="School Icon" />
            <span className="text-xl font-semibold">School</span>
          </button>

          <button
            type="button"
            onClick={() => setValue("educationType", "college")}
            className={`flex flex-col items-center gap-4 p-8 rounded-xl border-2 transition-all ${selectedType === "college"
              ? "border-blue-500 bg-blue-50 text-blue-600 shadow-lg"
              : "border-gray-300 hover:border-gray-400 text-gray-600 hover:shadow-md"
              }`}
          >
            <img src={college} className="w-22" alt="College Icon" />
            <span className="text-xl font-semibold">College</span>
          </button>
        </div>

        {/* Error for Education Type */}
        {errors.educationType && (
          <p className="text-red-500 text-sm text-center mt-2">
            {errors.educationType.message}
          </p>
        )}

        {/* If School → Board Selection */}
        {selectedType === "school" && (
          <div className="mt-8">
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

            {/* Error for Board */}
            {errors.board && (
              <p className="text-red-500 text-sm text-center mt-3">
                {errors.board.message}
              </p>
            )}
          </div>
        )}

        {/* If College → University Search Field */}
        {selectedType === "college" && (
          <div className="mt-8">
            <SmartSearchInput
              label="Select Your University"
              name="universityName"
              type="college"
              placeholder="University of Delhi"
              register={register}
              errors={errors}
              onSelect={(val) => setValue("universityName", val, { shouldValidate: true })}
            />
          </div>
        )}
      </div>
    );
  }


  // Step 5: School Details
  function Step5School({ form }) {
    const { register, watch, formState } = form;
    const { errors } = formState;

    const classes = ["6th", "7th", "8th", "9th", "10th", "11th", "12th"];
    const selectedClass = watch('class')
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            School Information
          </h2>
          <p className="text-gray-600">Just a couple more details</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Class
          </label>
          <select
            {...register("class")}
            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
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
        {/* Conditional For Stream */}
        {/* Conditional For Stream */}
        {(selectedClass === "11th" || selectedClass === "12th") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Stream ✨
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Science Stream */}
              <button
                type="button"
                onClick={() => form.setValue("stream", "Science", { shouldDirty: true, shouldValidate: true, shouldTouch: true })}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${watch("stream") === "Science"
                  ? "ring-4 ring-blue-500 scale-105 shadow-2xl"
                  : "hover:ring-2 hover:ring-blue-300"
                  }`}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-2 text-6xl">🧬</div>
                  <div className="absolute bottom-4 left-2 text-5xl">⚛️</div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl opacity-20">🔬</div>
                </div>
                <div className="relative z-10 text-white">
                  <div className="text-4xl mb-3">🧪</div>
                  <h3 className="text-2xl font-bold mb-2">Science</h3>
                  <p className="text-sm opacity-90">Physics • Chemistry • Biology</p>
                </div>
                {watch("stream") === "Science" && (
                  <div className="absolute top-3 right-3 bg-white text-blue-600 rounded-full p-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Commerce Stream */}
              <button
                type="button"
                onClick={() => form.setValue("stream", "Commerce", { shouldDirty: true, shouldValidate: true, shouldTouch: true })}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${watch("stream") === "Commerce"
                  ? "ring-4 ring-green-500 scale-105 shadow-2xl"
                  : "hover:ring-2 hover:ring-green-300"
                  }`}
                style={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-2 text-6xl">📊</div>
                  <div className="absolute bottom-4 left-2 text-5xl">💼</div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl opacity-20">⚖️</div>
                </div>
                <div className="relative z-10 text-white">
                  <div className="text-4xl mb-3">💰</div>
                  <h3 className="text-2xl font-bold mb-2">Commerce</h3>
                  <p className="text-sm opacity-90">Accounts • Business • Economics</p>
                </div>
                {watch("stream") === "Commerce" && (
                  <div className="absolute top-3 right-3 bg-white text-green-600 rounded-full p-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Arts Stream */}
              <button
                type="button"
                onClick={() => form.setValue("stream", "Arts", { shouldDirty: true, shouldValidate: true, shouldTouch: true })}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${watch("stream") === "Arts"
                  ? "ring-4 ring-orange-500 scale-105 shadow-2xl"
                  : "hover:ring-2 hover:ring-orange-300"
                  }`}
                style={{
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-2 text-6xl">🎨</div>
                  <div className="absolute bottom-4 left-2 text-5xl">📚</div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl opacity-20">🏛️</div>
                </div>
                <div className="relative z-10 text-white">
                  <div className="text-4xl mb-3">✍️</div>
                  <h3 className="text-2xl font-bold mb-2">Arts</h3>
                  <p className="text-sm opacity-90">History • Literature • Sociology</p>
                </div>
                {watch("stream") === "Arts" && (
                  <div className="absolute top-3 right-3 bg-white text-orange-600 rounded-full p-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
            <input type="hidden" {...register("stream", { required: "Please select your stream" })} />
            {errors.stream && (
              <p className="text-red-500 text-sm mt-2 text-center font-medium">
                {errors.stream.message}
              </p>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Name
          </label>
          <input
            {...register("schoolName")}
            placeholder="Enter your school name"
            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          {errors.schoolName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.schoolName.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Step 5: College Details
  function Step5College({ form }) {
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Last Question</h2>
          <p className="text-gray-600">Tell us about your college education</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Level
          </label>
          <select
            {...register("courseLevel")}
            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
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
            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          {errors.courseDetails && (
            <p className="text-red-500 text-sm mt-1">
              {errors.courseDetails.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            College Name
          </label>
          <input
            {...register("collegeName")}
            placeholder="Enter your college name"
            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          {errors.collegeName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.collegeName.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Step 6 College
  function Step6College({ form }) {
    const { register, formState, setValue, watch } = form;
    const { user } = useUser();

    const [selectedExams, setSelectedExams] = useState(watch("examsPreparingFor") || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Initialize selectedExams from form data if available
    const formExams = watch("examsPreparingFor");
    useEffect(() => {
      if (formExams && Array.isArray(formExams) && formExams.length > 0 && selectedExams.length === 0) {
        setSelectedExams(formExams);
      }
    }, [formExams, selectedExams.length]);

    // Sync selectedExams with form when it changes
    useEffect(() => {
      if (JSON.stringify(formExams) !== JSON.stringify(selectedExams)) {
        setValue("examsPreparingFor", selectedExams, { shouldValidate: true });
      }

    }, [selectedExams, setValue]);

    // Filter exams based on search query
    const filteredExams = examsList.filter((exam) =>
      exam.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleExam = (exam) => {
      setSelectedExams((prev) =>
        prev.includes(exam)
          ? prev.filter((e) => e !== exam)
          : [...prev, exam]
      );
      if (errors.examsPreparingFor) {
        setErrors({});
      }
    };

    const removeExam = (exam) => {
      setSelectedExams((prev) => prev.filter((e) => e !== exam));
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target) &&
          inputRef.current &&
          !inputRef.current.contains(event.target)
        ) {
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 ">Almost Done!</h2>
          <p className="text-gray-600">
            Tell us about how you going to use admeasy and exams you’re preparing for 🎯
          </p>
        </div>
        <div className="w-full max-w-3xl mx-auto">
          <div className="space-y-4">
            {/* What Brings You to Admeasy */}
            <div className="mt-8">
              <label className="block text-base font-semibold text-gray-900 mb-3">
                What brings you to Admeasy?
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Choose the reason that best describes your goal 💡
              </p>
              <p className="text-sm text-red-800">
                {errors.reasonForAdmeasy}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Just Exploring", color: "bg-blue-50", iconBg: "bg-blue-100", icon: "🧭" },
                  { label: "Finding Mentorship", color: "bg-purple-50", iconBg: "bg-purple-100", icon: "🤝" },
                  { label: "Switching College or Course", color: "bg-yellow-50", iconBg: "bg-yellow-100", icon: "🔄" },
                  { label: "Internship or Placement Opportunities", color: "bg-green-50", iconBg: "bg-green-100", icon: "💼" },
                  { label: "Scholarship", color: "bg-pink-50", iconBg: "bg-pink-100", icon: "🎓" },
                ].map((option) => {
                  const selectedReason = watch("reasonForAdmeasy");
                  const isSelected = selectedReason === option.label;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        setValue(
                          "reasonForAdmeasy",
                          isSelected ? "" : option.label // 🧠 toggle selection on second click
                        )
                      }
                      className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                        ? "border-blue-500 bg-blue-100 shadow-md"
                        : "border-transparent hover:border-gray-300"
                        } ${option.color}`}
                    >
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-lg ${option.iconBg}`}
                      >
                        {option.icon}
                      </div>
                      <span className="text-gray-900 font-medium text-left">
                        {option.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>


                  );
                })}
              </div>

              {/* Input for optional text */}
              <div className="mt-5">
                <input
                  type="text"
                  {...register("reasonForAdmeasyInput")}
                  placeholder="Tell us more (optional)..."
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-gray-900 placeholder-gray-500"
                />
              </div>
              {errors.examsPreparingFor && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top duration-300">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-800">
                    {errors.examsPreparingFor.message}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                Which exams are you preparing for?
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Search and select exams to customize your learning experience
              </p>
            </div>


            {/* Selected Exams Tags */}
            {selectedExams.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedExams.map((exam) => (
                  <div
                    key={exam}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium animate-in fade-in zoom-in duration-200"
                  >
                    {exam}
                    <button
                      onClick={() => removeExam(exam)}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${exam}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search for exams..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Dropdown List */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {filteredExams.length > 0 ? (
                    <div className="py-2">
                      {filteredExams.map((exam) => {
                        const isSelected = selectedExams.includes(exam);
                        return (
                          <button
                            key={exam}
                            type="button"
                            onClick={() => toggleExam(exam)}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                              }`}
                          >
                            <span
                              className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'
                                }`}
                            >
                              {exam}
                            </span>
                            {isSelected && (
                              <div className="bg-blue-600 rounded-full p-1">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <p className="text-sm">No exams found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {selectedExams.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">{selectedExams.length}</span> exam
                  {selectedExams.length > 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {/* Error Message */}
            {errors.examsPreparingFor && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top duration-300">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-800">
                  {errors.examsPreparingFor.message}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }
}