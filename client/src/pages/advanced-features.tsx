import { Header } from '@/components/header';
import { ConversationalRefiner } from '@/components/ConversationalRefiner';
import { FocusForecast } from '@/components/FocusForecast';
import { ProductivityInsights } from '@/components/ProductivityInsights';
import { AutoScheduler } from '@/components/AutoScheduler';
import { GoalTracking } from '@/components/GoalTracking';
import { HabitGamification } from '@/components/HabitGamification';
import { IntegrationHub } from '@/components/IntegrationHub';
import { SmartTaskInput } from '@/components/SmartTaskInput';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

export default function AdvancedFeatures() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Advanced AI Features
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Unlock the full power of AI-driven productivity with our comprehensive feature set
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Phase 3: Core AI Features */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Core AI Intelligence
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SmartTaskInput />
              <ProductivityInsights />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FocusForecast />
              <ConversationalRefiner 
                onTasksRefined={(tasks) => console.log('Tasks refined:', tasks)} 
              />
            </div>
          </section>

          {/* Phase 4: Advanced Scheduling & Organization */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Smart Scheduling & Goal Management
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AutoScheduler />
              <GoalTracking />
            </div>
          </section>

          {/* Phase 5: Gamification & Motivation */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Gamification & Motivation
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              <HabitGamification />
            </div>
          </section>

          {/* Phase 6: Integrations & Workflow */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Integrations & Workflow
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              <IntegrationHub />
            </div>
          </section>

          {/* Feature Overview */}
          <section className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Complete Feature Ecosystem
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                  AI-Powered Intelligence
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Natural language task parsing</li>
                  <li>• Conversational task refinement</li>
                  <li>• Productivity pattern analysis</li>
                  <li>• Focus window prediction</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  Smart Organization
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Intelligent auto-scheduling</li>
                  <li>• Goal tracking & alignment</li>
                  <li>• Priority optimization</li>
                  <li>• Burnout prevention</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Motivation & Growth
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Achievement system</li>
                  <li>• Streak tracking</li>
                  <li>• Level progression</li>
                  <li>• External integrations</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}