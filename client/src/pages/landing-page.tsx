import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Star, Users, Brain, Target, Clock, Zap } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    content: "Planify transformed how I manage my daily tasks. The AI suggestions are spot-on, helping me prioritize what truly matters. My productivity increased by 40% in just 2 weeks!",
    rating: 5
  },
  {
    name: "Michael Rodriguez",
    role: "Software Developer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    content: "The smart task breakdown feature is a game-changer. Complex projects become manageable, and I never miss deadlines anymore. Worth every penny!",
    rating: 5
  },
  {
    name: "Emily Watson",
    role: "Marketing Director",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    content: "I love how Planify learns my work patterns. The AI-powered scheduling suggestions align perfectly with my energy levels throughout the day.",
    rating: 5
  },
  {
    name: "David Kim",
    role: "Entrepreneur",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    content: "Running multiple businesses was overwhelming until I found Planify. The AI prioritization keeps me focused on what drives real results.",
    rating: 5
  },
  {
    name: "Lisa Thompson",
    role: "Freelance Designer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    content: "Planify's goal breakdown feature turned my creative chaos into organized success. I'm completing projects 50% faster now.",
    rating: 5
  }
];

const features = [
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Smart task analysis and categorization that learns from your patterns"
  },
  {
    icon: Target,
    title: "Goal Achievement",
    description: "Break down complex goals into actionable steps with AI guidance"
  },
  {
    icon: Clock,
    title: "Time Optimization",
    description: "AI suggests optimal scheduling based on your productivity patterns"
  },
  {
    icon: Zap,
    title: "Instant Insights",
    description: "Real-time productivity analytics and personalized recommendations"
  }
];

const stats = [
  { value: "87%", label: "Tasks Completed On Time" },
  { value: "3.2x", label: "Productivity Increase" },
  { value: "45min", label: "Daily Time Saved" },
  { value: "92%", label: "User Satisfaction" }
];

export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  
  // Create infinite loop by duplicating testimonials
  const extendedTestimonials = [...testimonials, ...testimonials.slice(0, 3)];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => {
        const next = prev + 1;
        // Reset to beginning when reaching the end (creates seamless loop)
        if (next >= testimonials.length) {
          setTimeout(() => {
            setIsTransitioning(false);
            setCurrentTestimonial(0);
            setTimeout(() => setIsTransitioning(true), 50);
          }, 500);
          return next;
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img 
                src="/attached_assets/Planify_imresizer_1754161747016.jpg"
                alt="Planify"
                className="w-8 h-8 rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) nextElement.style.display = 'flex';
                }}
              />
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-sm" style={{display: 'none'}}>
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Planify</span>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Features</a>
                <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Pricing</a>
              </nav>
              <div className="flex gap-4">
                <Link href="/auth?mode=login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button>Get Started Free</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <img 
              src="/attached_assets/Planify_imresizer_1754161747016.jpg"
              alt="Planify Logo"
              className="w-20 h-20 rounded-xl shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) nextElement.style.display = 'flex';
              }}
            />
            <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg" style={{display: 'none'}}>
              <span className="text-white font-bold text-3xl">P</span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your AI-Powered
            <span className="text-teal-600 block">Productivity Partner</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your daily chaos into organized success. Planify uses advanced AI to understand your work style and optimize your productivity like never before.
          </p>
          <div className="flex justify-center mb-12">
            <Link href="/auth?mode=signup">
              <Button size="lg" className="text-lg px-8">
                Start Free
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-teal-600">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Powered by Advanced AI Technology
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="w-12 h-12 text-teal-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Loved by Thousands of Productive People
          </h2>
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div 
                className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{
                  transform: `translateX(-${currentTestimonial * (100 / 3)}%)`,
                  width: `${(extendedTestimonials.length * 100) / 3}%`
                }}
              >
                {extendedTestimonials.map((testimonial, index) => (
                  <div key={`${testimonial.name}-${index}`} className="w-1/3 px-4">
                    <Card className="p-6 h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 italic text-sm">
                        "{testimonial.content}"
                      </p>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: testimonials.length }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsTransitioning(true);
                    setCurrentTestimonial(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentTestimonial % testimonials.length === index ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            Start free, upgrade when you're ready for unlimited AI power
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Free Plan */}
            <div className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$0<span className="text-sm text-gray-500">/month</span></div>
              <ul className="text-left space-y-3 text-gray-600 dark:text-gray-300 mb-6">
                <li className="flex items-center gap-2">✓ Basic task management</li>
                <li className="flex items-center gap-2">✓ 3 AI requests per day</li>
                <li className="flex items-center gap-2">✓ Simple task creation</li>
                <li className="flex items-center gap-2">✓ Mobile app access</li>
              </ul>
              <Link href="/auth?mode=signup">
                <Button variant="outline" className="w-full">Get Started Free</Button>
              </Link>
            </div>
            
            {/* Premium Plan */}
            <div className="p-6 border-2 border-teal-500 rounded-xl relative bg-teal-50 dark:bg-teal-900/20">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Popular
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$5<span className="text-sm text-gray-500">/month</span></div>
              <ul className="text-left space-y-3 text-gray-600 dark:text-gray-300 mb-6">
                <li className="flex items-center gap-2">✓ Everything in Free</li>
                <li className="flex items-center gap-2">✓ Unlimited AI requests</li>
                <li className="flex items-center gap-2">✓ AI task breakdown</li>
                <li className="flex items-center gap-2">✓ Smart scheduling</li>
                <li className="flex items-center gap-2">✓ Priority support</li>
              </ul>
              <Link href="/auth?mode=signup">
                <Button className="w-full">Start Premium Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-teal-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands who've already revolutionized their work life with AI
          </p>
          <Link href="/auth?mode=signup">
            <Button size="lg" className="text-lg px-8 bg-white text-teal-600 hover:bg-gray-100">
              Get Started - It's Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; 2025 Planify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}