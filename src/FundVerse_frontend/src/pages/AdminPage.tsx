import React, { useState, useEffect } from "react";
import type { AdminService, IdeaStatus, Project } from "../types/admin";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { 
  Badge
} from "../components/ui/badge";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  MessageSquare
} from "lucide-react";

interface AdminPageProps {
  adminActor: AdminService;
  identity: any;
}

const candidStatusToString = (status: any): IdeaStatus => {
  if ('Pending' in status) return 'Pending';
  if ('UnderReview' in status) return 'UnderReview';
  if ('Approved' in status) return 'Approved';
  if ('Rejected' in status) return 'Rejected';
  if ('RequiresRevision' in status) return 'RequiresRevision';
  return 'Pending';
};

const stringToCandidStatus = (status: IdeaStatus): any => {
  switch (status) {
    case 'Pending': return { Pending: null };
    case 'UnderReview': return { UnderReview: null };
    case 'Approved': return { Approved: null };
    case 'Rejected': return { Rejected: null };
    case 'RequiresRevision': return { RequiresRevision: null };
    default: return { Pending: null };
  }
};

export const AdminPage: React.FC<AdminPageProps> = ({ adminActor, identity }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const projectsData = await adminActor.get_projects();
      
      const convertedProjects: Project[] = projectsData.map(project => ({
        id: project.id,
        idea_id: project.idea_id,
        title: project.title,
        description: project.description,
        funding_goal_e8s: project.funding_goal_e8s,
        legal_entity: project.legal_entity,
        contact_info: project.contact_info,
        category: project.category,
        business_registration: project.business_registration,
        submitted_by: project.submitted_by.toText(),
        submitted_at_ns: project.submitted_at_ns,
        status: candidStatusToString(project.status),
        project_duration_days: project.project_duration_days,
        milestones: project.milestones,
        document_ids: Array.isArray(project.document_ids) ? project.document_ids : Array.from(project.document_ids),
        admin_notes: project.admin_notes.length > 0 ? project.admin_notes[0] : undefined,
        review_date_ns: project.review_date_ns.length > 0 ? project.review_date_ns[0] : undefined,
        reviewer: project.reviewer.length > 0 && project.reviewer[0] ? project.reviewer[0].toText() : undefined
      }));
      
      setProjects(convertedProjects);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProject = async (projectId: bigint, status: IdeaStatus) => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      await adminActor.review_project(projectId, stringToCandidStatus(status), reviewNotes ? [reviewNotes] : []);
      setSelectedProject(null);
      setReviewNotes("");
      await loadData();
    } catch (error) {
      console.error("Error reviewing project:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: IdeaStatus) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'UnderReview':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Under Review</Badge>;
      case 'Approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      case 'RequiresRevision':
        return <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Requires Revision</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage projects and reviews</p>
        </div>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Projects ({projects.length})
          </CardTitle>
          <CardDescription>
            Review and manage submitted projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No projects submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id.toString()} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{project.title}</h3>
                          {getStatusBadge(project.status)}
                        </div>
                        <p className="text-gray-600 mb-2">{project.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Category:</span> {project.category}
                          </div>
                          <div>
                            <span className="font-medium">Goal:</span> {(Number(project.funding_goal_e8s) / 100_000_000).toFixed(4)} ICP
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {project.project_duration_days} days
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span> {new Date(Number(project.submitted_at_ns) / 1000000).toLocaleDateString()}
                          </div>
                        </div>
                        {project.admin_notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <span className="font-medium">Admin Notes:</span> {project.admin_notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProject(project)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Project: {selectedProject.title}</CardTitle>
              <CardDescription>
                Current status: {selectedProject.status}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="review-notes">Review Notes</Label>
                <Input
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleReviewProject(selectedProject.id, 'Approved')}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReviewProject(selectedProject.id, 'Rejected')}
                  variant="destructive"
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
              
              <Button
                onClick={() => setSelectedProject(null)}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
