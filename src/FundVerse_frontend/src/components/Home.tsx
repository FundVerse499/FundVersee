import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

const Home = () => {
  const campaigns = [
    { id: 1, title: "Campaign 1", description: "This is the first campaign" },
    { id: 2, title: "Campaign 2", description: "This is the second campaign" },
  ];

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {campaigns.map((c) => (
        <Card key={c.id} className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle>{c.title}</CardTitle>
            <CardDescription>{c.description}</CardDescription>
          </CardHeader>
          <div className="p-4">
            <Link
              to={`/campaign/${c.id}`}
              className="text-blue-600 hover:underline"
            >
              ➡ View Campaign
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Home;