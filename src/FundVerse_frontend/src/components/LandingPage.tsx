import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  TrendingUp,
  Users,
  Target,
  Shield,
  Globe,
  Zap,
  ArrowRight,
  Rocket,
  Coins,
  Lock,
  Facebook,
  Twitter,
  Linkedin,
  Github
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col justify-between">
      
      {/* محتوى الصفحة */}
      <div>
        {/* Hero Section */}
        
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden"
        >
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

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
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
              </motion.div>
            </div>
          </div>
        </motion.section>
        
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
              {[
                { icon: Zap, color: "purple", title: "Instant Settlements", desc: "Get your funds instantly with ICP transfers. No waiting, no delays." },
                { icon: Shield, color: "green", title: "Decentralized Security", desc: "Built on Internet Computer blockchain for maximum security and transparency." },
                { icon: Users, color: "blue", title: "Global Community", desc: "Connect with backers worldwide. No geographical restrictions." },
                { icon: Coins, color: "pink", title: "ICP Native", desc: "Native ICP integration for seamless transactions and low fees." },
                { icon: Lock, color: "yellow", title: "Smart Contracts", desc: "Automated escrow and release mechanisms ensure trust and security." },
                { icon: TrendingUp, color: "indigo", title: "Real-time Tracking", desc: "Monitor your campaign progress and contributions in real-time." },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.08, y: -10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card
                      className={`bg-black/20 border-white/10 hover:border-${feature.color}-500/50 transition-all duration-500 cursor-pointer shadow-md hover:shadow-${feature.color}-500/40`}
                    >
                      <CardHeader className="flex flex-col items-start">
                        <motion.div
                          whileHover={{ scale: 1.3, y: -6 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className={`w-12 h-12 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-4`}
                        >
                          <feature.icon className={`h-6 w-6 text-${feature.color}-400`} />
                        </motion.div>
                        <CardTitle className="text-white">{feature.title}</CardTitle>
                        <CardDescription className="text-white/70">
                          {feature.desc}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 text-white py-8 mt-10">
        <div className="container mx-auto px-6 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo + Copy */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              FundVerse
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              © {new Date().getFullYear()} FundVerse. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-gray-400 text-sm">
            <a href="#about" className="hover:text-purple-400 transition">About</a>
            <a href="#features" className="hover:text-purple-400 transition">Features</a>
            <a href="#pricing" className="hover:text-purple-400 transition">Pricing</a>
            <a href="#contact" className="hover:text-purple-400 transition">Contact</a>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4">
            {[Facebook, Twitter, Linkedin, Github].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-purple-600 transition"
              >
                <Icon className="w-5 h-5 text-gray-300 hover:text-white" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
