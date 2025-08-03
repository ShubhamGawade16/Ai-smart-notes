import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager at Google",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
      content: "Planify's AI task management has transformed how I organize my work. The smart timing feature helps me tackle complex projects when I'm most focused.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Freelance Designer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
      content: "The AI suggestions are incredibly accurate. It's like having a personal productivity coach that actually understands my workflow patterns.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Software Engineer",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
      content: "Finally, a task manager that adapts to me instead of forcing me into rigid structures. The circadian rhythm insights are game-changing.",
      rating: 5
    }
  ];

  return (
    <Card className="h-fit">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Quote className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">What Users Say</h3>
        </div>
        
        <div className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{testimonial.name}</span>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-center">
          <p className="text-xs text-teal-700 dark:text-teal-300">
            Join 10,000+ productive users worldwide
          </p>
        </div>
      </CardContent>
    </Card>
  );
}