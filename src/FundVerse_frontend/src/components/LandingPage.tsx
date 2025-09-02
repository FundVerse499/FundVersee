import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Shield, 
  Globe, 
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Rocket,
  Coins,
  Lock
} from 'lucide-react';

interface LandingPageProps {
  onCreateProject: () => void;
  onExploreCampaigns: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateProject,
  onExploreCampaigns
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2">
                <Globe className="h-4 w-4 mr-2" />
                Powered by Internet Computer
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                FundVerse
              </h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
                The future of decentralized fundraising on the Internet Computer. 
                Create, discover, and fund innovative projects with instant settlements.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={onCreateProject}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Launch Your Project
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                onClick={onExploreCampaigns}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                <Target className="h-5 w-5 mr-2" />
                Explore Campaigns
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose FundVerse?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Built on the Internet Computer for maximum security, transparency, and efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-black/20 border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">Instant Settlements</CardTitle>
                <CardDescription className="text-white/70">
                  Get your funds instantly with ICP transfers. No waiting, no delays.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/20 border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Decentralized Security</CardTitle>
                <CardDescription className="text-white/70">
                  Built on Internet Computer blockchain for maximum security and transparency.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/20 border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Global Community</CardTitle>
                <CardDescription className="text-white/70">
                  Connect with backers worldwide. No geographical restrictions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/20 border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Coins className="h-6 w-6 text-pink-400" />
                </div>
                <CardTitle className="text-white">ICP Native</CardTitle>
                <CardDescription className="text-white/70">
                  Native ICP integration for seamless transactions and low fees.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/20 border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white">Smart Contracts</CardTitle>
                <CardDescription className="text-white/70">
                  Automated escrow and release mechanisms ensure trust and security.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/20 border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-indigo-400" />
                </div>
                <CardTitle className="text-white">Real-time Tracking</CardTitle>
                <CardDescription className="text-white/70">
                  Monitor your campaign progress and contributions in real-time.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-purple-400">100+</div>
              <div className="text-white/70">Active Campaigns</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-400">$2M+</div>
              <div className="text-white/70">Total Raised</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-400">10K+</div>
              <div className="text-white/70">Backers</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-pink-400">99.9%</div>
              <div className="text-white/70">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold text-white">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/70">
              Join thousands of creators and backers on the most advanced fundraising platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={onCreateProject}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
              <Button 
                onClick={onExploreCampaigns}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                <Target className="h-5 w-5 mr-2" />
                Browse Projects
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              FundVerse
            </span>
          </div>
          <p className="text-white/60">
            © 2024 FundVerse. Built on the Internet Computer.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
