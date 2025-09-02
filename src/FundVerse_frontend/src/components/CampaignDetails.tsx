import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";

// مثال داتا مبدئي – تقدري بعدين توصليها بالـ backendActor أو fundFlowActor
const campaigns = [
  {
    id: "1",
    title: "Save the Forests",
    description: "Help us protect and restore forests worldwide.",
    target: 5000,
    deadline: "2025-12-31",
    raised: 1200,
  },
  {
    id: "2",
    title: "Clean Water for All",
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Campaign not found 😢</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{campaign.title}</CardTitle>
          <CardDescription>Deadline: {campaign.deadline}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{campaign.description}</p>
          <p className="text-sm text-gray-700">
            🎯 Target: ${campaign.target}
          </p>
          <p className="text-sm text-gray-700">
            💰 Raised: ${campaign.raised}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={() => navigate("/")}>⬅ Back</Button>
          <Button>Contribute</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CampaignDetails;