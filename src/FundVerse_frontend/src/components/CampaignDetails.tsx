import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { ArrowLeft, DollarSign, Target, Calendar } from "lucide-react";

// مثال داتا مبدئي – بعدين هنوصلها بالـ backendActor أو fundFlowActor
const campaigns = [
  {
    id: "1",
    title: "🌳 Save the Forests",
    description: "Help us protect and restore forests worldwide.",
    target: 5000,
    deadline: "2025-12-31",
    raised: 1200,
  },
  {
    id: "2",
    title: "💧 Clean Water for All",
    description: "Provide clean and safe drinking water.",
    target: 8000,
    deadline: "2025-11-15",
    raised: 3000,
  },
];

const CampaignDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // نجيب الحملة المطلوبة بالـ id
  const campaign = campaigns.find((c) => c.id === id);

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <p className="text-xl font-semibold text-gray-200">
          🚨 Campaign not found 😢
        </p>
      </div>
    );
  }

  // نسبة التبرع
  const progressPercentage = Math.min(
    (campaign.raised / campaign.target) * 100,
    100
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* المحتوى */}
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              {campaign.title}
            </CardTitle>
            <CardDescription className="text-gray-300 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              Deadline: {campaign.deadline}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-gray-200">{campaign.description}</p>

            <div className="flex justify-between text-gray-300 text-sm">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-green-400" />
                Target: ${campaign.target}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                Raised: ${campaign.raised}
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={progressPercentage} className="h-3 bg-gray-700" />
            <p className="text-right text-gray-300 text-sm">
              {progressPercentage.toFixed(1)}% funded
            </p>
          </CardContent>

          <CardFooter className="flex justify-between mt-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all">
              Contribute
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/20 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center text-gray-400 text-sm">
          <span>© {new Date().getFullYear()} FundVerse. All rights reserved.</span>
          <div className="space-x-4">
            <a href="/" className="hover:text-purple-400 transition">
              Home
            </a>
            <a href="/campaigns" className="hover:text-purple-400 transition">
              Campaigns
            </a>
            <a href="/about" className="hover:text-purple-400 transition">
              About
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CampaignDetails;
