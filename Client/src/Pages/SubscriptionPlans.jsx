import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, ArrowRight, Loader2, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { useMentor } from '../context/MentorContext';
import SEO from '../components/SEO';

const SubscriptionPlans = () => {
  const [searchParams] = useSearchParams();
  const mentorId = searchParams.get('mentorId');
  const navigate = useNavigate();
  const { user } = useUser();
  const { mentor } = useMentor();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [processingPlan, setProcessingPlan] = useState(null);
  const [mentorInfo, setMentorInfo] = useState(null);

  useEffect(() => {
    fetchPlans();
    if (mentorId) {
      fetchMentorInfo();
    }
  }, [mentorId]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorInfo = async () => {
    try {
      const response = await fetch(`/api/mentors/${mentorId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMentorInfo(data);
      }
    } catch (error) {
      console.error('Error fetching mentor info:', error);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan) => {
    if (!user && !mentor) {
      toast.info('Please login to subscribe', { position: 'top-center' });
      navigate('/login');
      return;
    }

    if (!mentorId) {
      toast.error('Mentor information is missing');
      return;
    }

    setProcessingPlan(plan._id);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        return;
      }

      // Create subscription order
      const orderRes = await fetch('/api/payments/create-subscription-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planId: plan._id,
          mentorId: mentorId,
          billingPeriod: selectedPeriod
        })
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderData = await orderRes.json();
      const price = plan.price[selectedPeriod];

      const options = {
        key: orderData.order.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Admeasy',
        description: `Subscription: ${plan.name} (${selectedPeriod})`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            setProcessingPlan(plan._id);
            
            const verifyRes = await fetch('/api/payments/verify-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: orderData.paymentId
              })
            });

            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok || verifyRes.status === 409) {
              toast.success('Subscription activated successfully!');
              setTimeout(() => {
                navigate('/my-subscriptions');
              }, 1500);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('Payment successful but verification failed. Please contact support.');
          } finally {
            setProcessingPlan(null);
          }
        },
        prefill: {
          name: user?.name || mentor?.name || '',
          email: user?.email || mentor?.email || '',
          contact: user?.phone || mentor?.phone || ''
        },
        theme: {
          color: '#9f3562'
        },
        modal: {
          ondismiss: function() {
            setProcessingPlan(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setProcessingPlan(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-[#9f3562] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription plans...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Subscription Plans | Admeasy"
        description="Choose a subscription plan to access premium mentor content"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/40 relative overflow-x-hidden py-12 px-4 sm:px-6 lg:px-8">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#9f3562]/8 to-pink-300/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/8 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#9f3562]/10 to-[#b14270]/10 rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-[#9f3562]" />
              <span className="text-sm font-semibold text-[#9f3562]">Premium Access</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-admeasy-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {mentorInfo 
                ? `Subscribe to ${mentorInfo.name || mentorInfo.username} and unlock exclusive content`
                : 'Select a subscription plan to access premium mentor content and features'
              }
            </p>
          </motion.div>

          {/* Billing Period Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white shadow-lg shadow-[#9f3562]/30'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white shadow-lg shadow-[#9f3562]/30'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Save</span>
            </button>
          </motion.div>

          {/* Plans Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            <AnimatePresence mode="wait">
              {plans.map((plan, index) => {
                const price = plan.price[selectedPeriod];
                const originalPrice = plan.originalPrice[selectedPeriod];
                const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

                return (
                  <motion.div
                    key={plan._id}
                    variants={cardVariants}
                    whileHover="hover"
                    className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-[#9f3562]/30 overflow-hidden flex flex-col"
                  >
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg">
                        {discount}% OFF
                      </div>
                    )}

                    <div className="p-6 sm:p-8 flex-1 flex flex-col">
                      {/* Plan Name */}
                      <h3 className="text-2xl font-admeasy-bold text-gray-900 mb-2">{plan.name}</h3>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-admeasy-bold text-gray-900">₹{price}</span>
                          <span className="text-gray-500">/{selectedPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                        {originalPrice > price && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg text-gray-400 line-through">₹{originalPrice}</span>
                            <span className="text-sm text-green-600 font-semibold">Save ₹{originalPrice - price}</span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index + 0.1 * idx }}
                            className="flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-[#9f3562] to-[#b14270] flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>

                      {/* Subscribe Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSubscribe(plan)}
                        disabled={processingPlan === plan._id || !mentorId}
                        className="w-full py-4 bg-gradient-to-r from-[#9f3562] to-[#b14270] text-white rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:shadow-[#9f3562]/30 border border-transparent flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingPlan === plan._id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            Subscribe Now
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-gray-500">
              All subscriptions are auto-renewable. You can cancel anytime from your account settings.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPlans;
