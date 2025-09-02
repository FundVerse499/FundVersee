import React, { useState, useEffect } from "react";
import type { _SERVICE as FundVerseBackendService } from "../../../declarations/FundVerse_backend/FundVerse_backend.did.d.ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Loader2, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

// Step 1: Basic Project Information
const basicInfoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  fundingGoal: z.string().min(1, "Funding goal is required"),
  legalEntity: z.string().min(1, "Legal entity is required"),
  contactInfo: z.string().email("Valid email is required"),
  category: z.string().min(1, "Category is required"),
  businessRegistration: z.string().min(1, "Business registration is required"),
});

// Step 2: Financial Documents
const financialDocsSchema = z.object({
  businessPlan: z.any().optional(),
  financialProjections: z.any().optional(),
  legalDocuments: z.any().optional(),
  taxReturns: z.any().optional(),
});

// Step 3: Milestones
const milestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amount: z.string().min(1, "Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

const milestonesSchema = z.object({
  projectDuration: z.string().min(1, "Project duration is required"),
  milestones: z.array(milestoneSchema).min(1, "At least one milestone is required"),
});

// Step 4: Agreements
const agreementsSchema = z.object({
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  privacyAccepted: z.boolean().refine(val => val === true, "You must accept the privacy policy"),
  legalAccepted: z.boolean().refine(val => val === true, "You must accept the legal framework"),
});

type BasicInfoForm = z.infer<typeof basicInfoSchema>;
type FinancialDocsForm = z.infer<typeof financialDocsSchema>;
type MilestonesForm = z.infer<typeof milestonesSchema>;
type AgreementsForm = z.infer<typeof agreementsSchema>;

interface CreateProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backendActor: FundVerseBackendService;
  onProjectCreated: () => void;
}

type Step = 1 | 2 | 3 | 4;

export const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({
  open,
  onOpenChange,
  backendActor,
  onProjectCreated,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Debug loading state
  useEffect(() => {
    if (isLoading) {
      console.log("Loading state changed to true");
    } else {
      console.log("Loading state changed to false");
    }
  }, [isLoading]);
  
  // Form data storage
  const [formData, setFormData] = useState<{
    basicInfo?: BasicInfoForm;
    financialDocs?: FinancialDocsForm;
    milestones?: MilestonesForm;
    agreements?: AgreementsForm;
  }>({});

  // Step 1: Basic Info Form
  const basicInfoForm = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
  });

  // Step 2: Financial Docs Form
  const financialDocsForm = useForm<FinancialDocsForm>({
    resolver: zodResolver(financialDocsSchema),
  });

  // Step 3: Milestones Form
  const milestonesForm = useForm<MilestonesForm>({
    resolver: zodResolver(milestonesSchema),
    defaultValues: {
      milestones: [{ title: "", description: "", amount: "", dueDate: "" }],
    },
  });

  // Step 4: Agreements Form
  const agreementsForm = useForm<AgreementsForm>({
    resolver: zodResolver(agreementsSchema),
  });

  const categories = [
    "Technology",
    "Healthcare",
    "Education",
    "Environment",
    "Arts",
    "Sports",
    "Food",
    "Travel",
    "Finance",
    "Other",
  ];

  const handleNext = async () => {
    let isValid = false;

    try {
      switch (currentStep) {
        case 1:
          isValid = await basicInfoForm.trigger();
          if (isValid) {
            const data = basicInfoForm.getValues();
            setFormData(prev => ({ ...prev, basicInfo: data }));
            setCurrentStep(2);
          } else {
            console.log("Step 1 validation errors:", basicInfoForm.formState.errors);
          }
          break;
        case 2:
          // Manual validation for file sizes
          const data = financialDocsForm.getValues();
          let hasLargeFile = false;
          
          if (data.businessPlan && data.businessPlan.size > 2 * 1024 * 1024) {
            setSubmitError("Business plan file must be less than 2MB");
            hasLargeFile = true;
          } else if (data.financialProjections && data.financialProjections.size > 2 * 1024 * 1024) {
            setSubmitError("Financial projections file must be less than 2MB");
            hasLargeFile = true;
          } else if (data.legalDocuments && data.legalDocuments.size > 2 * 1024 * 1024) {
            setSubmitError("Legal documents file must be less than 2MB");
            hasLargeFile = true;
          } else if (data.taxReturns && data.taxReturns.size > 2 * 1024 * 1024) {
            setSubmitError("Tax returns file must be less than 2MB");
            hasLargeFile = true;
          }
          
          if (!hasLargeFile) {
            setFormData(prev => ({ ...prev, financialDocs: data }));
            setCurrentStep(3);
            setSubmitError(null);
          }
          break;
        case 3:
          isValid = await milestonesForm.trigger();
          if (isValid) {
            const data = milestonesForm.getValues();
            setFormData(prev => ({ ...prev, milestones: data }));
            setCurrentStep(4);
          } else {
            console.log("Step 3 validation errors:", milestonesForm.formState.errors);
          }
          break;
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async (data: AgreementsForm) => {
    console.log("handleSubmit called with data:", data);
    console.log("formData:", formData);
    
    setIsLoading(true);
    setSubmitError(null);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setSubmitError("Request timed out. Please try again.");
    }, 30000); // 30 seconds timeout

    try {
      if (!formData.basicInfo || !formData.milestones) {
        throw new Error("Missing required form data");
      }

      // 1. Create the idea
      const fundingGoalE8s = Math.floor(parseFloat(formData.basicInfo.fundingGoal) * 100_000_000);
      if (Number.isNaN(fundingGoalE8s) || fundingGoalE8s <= 0) {
        throw new Error("Funding goal must be a positive number");
      }

      const businessRegNat8 = Number(formData.basicInfo.businessRegistration) & 0xff;

      const ideaId: bigint = await backendActor.create_idea(
        formData.basicInfo.title,
        formData.basicInfo.description,
        BigInt(fundingGoalE8s),
        formData.basicInfo.category,
        formData.basicInfo.legalEntity,
        formData.basicInfo.contactInfo,
        businessRegNat8
      );

      // 2. Upload financial documents
      const uploadedDocs: bigint[] = [];
      if (formData.financialDocs) {
        const docs = [
          { file: formData.financialDocs.businessPlan, name: "business_plan" },
          { file: formData.financialDocs.financialProjections, name: "financial_projections" },
          { file: formData.financialDocs.legalDocuments, name: "legal_documents" },
          { file: formData.financialDocs.taxReturns, name: "tax_returns" },
        ];

        for (const doc of docs) {
          if (doc.file) {
            const arrayBuffer = await doc.file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            const docId = await backendActor.upload_doc(
              BigInt(ideaId),
              doc.name,
              doc.file.type,
              Array.from(bytes),
              BigInt(Date.now() >>> 0)
            );
            if (docId && docId.length > 0) {
              uploadedDocs.push(docId[0] as bigint);
            }
          }
        }
      }

      // 3. Create campaign with project duration
      const projectDurationDays = parseInt(formData.milestones.projectDuration);
      const nowSecs = Math.floor(Date.now() / 1000);
      const endDateSecs = nowSecs + projectDurationDays * 24 * 60 * 60;

      const createRes = await backendActor.create_campaign(
        BigInt(ideaId),
        BigInt(fundingGoalE8s),
        BigInt(endDateSecs)
      );

      if ("Err" in createRes) {
        throw new Error(createRes.Err);
      }

      // Success
      clearTimeout(timeoutId);
      resetAllForms();
      onOpenChange(false);
      onProjectCreated();
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Failed to create project:", err);
      let errorMessage = "Failed to create project";
      if (err?.message) {
        errorMessage = err.message;
      }
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllForms = () => {
    basicInfoForm.reset();
    financialDocsForm.reset();
    milestonesForm.reset();
    agreementsForm.reset();
    setFormData({});
    setCurrentStep(1);
    setSubmitError(null);
  };

  const addMilestone = () => {
    const currentMilestones = milestonesForm.getValues("milestones");
    milestonesForm.setValue("milestones", [
      ...currentMilestones,
      { title: "", description: "", amount: "", dueDate: "" }
    ]);
  };

  const removeMilestone = (index: number) => {
    const currentMilestones = milestonesForm.getValues("milestones");
    if (currentMilestones.length > 1) {
      const newMilestones = currentMilestones.filter((_, i) => i !== index);
      milestonesForm.setValue("milestones", newMilestones);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title</Label>
        <Input id="title" {...basicInfoForm.register("title")} placeholder="Enter project title" />
        {basicInfoForm.formState.errors.title && (
          <p className="text-sm text-red-500">{basicInfoForm.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...basicInfoForm.register("description")}
          placeholder="Describe your project"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {basicInfoForm.formState.errors.description && (
          <p className="text-sm text-red-500">{basicInfoForm.formState.errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fundingGoal">Funding Goal (ICP)</Label>
          <Input id="fundingGoal" type="number" step="0.00000001" {...basicInfoForm.register("fundingGoal")} placeholder="0.00" />
          {basicInfoForm.formState.errors.fundingGoal && (
            <p className="text-sm text-red-500">{basicInfoForm.formState.errors.fundingGoal.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            {...basicInfoForm.register("category")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {basicInfoForm.formState.errors.category && (
            <p className="text-sm text-red-500">{basicInfoForm.formState.errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="legalEntity">Legal Entity</Label>
        <Input id="legalEntity" {...basicInfoForm.register("legalEntity")} placeholder="Company or organization name" />
        {basicInfoForm.formState.errors.legalEntity && (
          <p className="text-sm text-red-500">{basicInfoForm.formState.errors.legalEntity.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactInfo">Contact Email</Label>
        <Input id="contactInfo" type="email" {...basicInfoForm.register("contactInfo")} placeholder="your@email.com" />
        {basicInfoForm.formState.errors.contactInfo && (
          <p className="text-sm text-red-500">{basicInfoForm.formState.errors.contactInfo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessRegistration">Business Registration Number</Label>
        <Input id="businessRegistration" {...basicInfoForm.register("businessRegistration")} placeholder="Enter registration number" />
        {basicInfoForm.formState.errors.businessRegistration && (
          <p className="text-sm text-red-500">{basicInfoForm.formState.errors.businessRegistration.message}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Please upload the required financial documents. All documents should be in PDF format and less than 2MB each.
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessPlan">Business Plan</Label>
          <div className="flex items-center gap-2">
            <Input
              id="businessPlan"
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  financialDocsForm.setValue("businessPlan", file);
                }
              }}
            />
            {formData.financialDocs?.businessPlan && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          {financialDocsForm.formState.errors.businessPlan && (
            <p className="text-sm text-red-500">{financialDocsForm.formState.errors.businessPlan.message?.toString()}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="financialProjections">Financial Projections (3-5 years)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="financialProjections"
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  financialDocsForm.setValue("financialProjections", file);
                }
              }}
            />
            {formData.financialDocs?.financialProjections && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          {financialDocsForm.formState.errors.financialProjections && (
            <p className="text-sm text-red-500">{financialDocsForm.formState.errors.financialProjections.message?.toString()}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="legalDocuments">Legal Documents</Label>
          <div className="flex items-center gap-2">
            <Input
              id="legalDocuments"
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  financialDocsForm.setValue("legalDocuments", file);
                }
              }}
            />
            {formData.financialDocs?.legalDocuments && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          {financialDocsForm.formState.errors.legalDocuments && (
            <p className="text-sm text-red-500">{financialDocsForm.formState.errors.legalDocuments.message?.toString()}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxReturns">Tax Returns (Last 2 years)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="taxReturns"
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  financialDocsForm.setValue("taxReturns", file);
                }
              }}
            />
            {formData.financialDocs?.taxReturns && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          {financialDocsForm.formState.errors.taxReturns && (
            <p className="text-sm text-red-500">{financialDocsForm.formState.errors.taxReturns.message?.toString()}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="projectDuration">Project Duration (days)</Label>
        <Input
          id="projectDuration"
          type="number"
          {...milestonesForm.register("projectDuration")}
          placeholder="e.g., 365"
        />
        {milestonesForm.formState.errors.projectDuration && (
          <p className="text-sm text-red-500">{milestonesForm.formState.errors.projectDuration.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Project Milestones</Label>
          <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
            <Plus className="h-4 w-4 mr-1" />
            Add Milestone
          </Button>
        </div>

        {milestonesForm.watch("milestones")?.map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Milestone {index + 1}</h4>
              {milestonesForm.watch("milestones")?.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMilestone(index)}
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  {...milestonesForm.register(`milestones.${index}.title`)}
                  placeholder="Milestone title"
                />
              </div>
              <div className="space-y-1">
                <Label>Amount (ICP)</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  {...milestonesForm.register(`milestones.${index}.amount`)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <textarea
                {...milestonesForm.register(`milestones.${index}.description`)}
                placeholder="Describe this milestone"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input
                type="date"
                {...milestonesForm.register(`milestones.${index}.dueDate`)}
              />
            </div>
          </div>
        ))}

        {milestonesForm.formState.errors.milestones && (
          <p className="text-sm text-red-500">{milestonesForm.formState.errors.milestones.message}</p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Please review and accept the following agreements to proceed with your project submission.
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="termsAccepted"
            {...agreementsForm.register("termsAccepted")}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label htmlFor="termsAccepted" className="text-sm font-medium">
              Terms and Conditions
            </Label>
            <p className="text-sm text-gray-600">
              I agree to the FundVerse terms and conditions governing project funding and management.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="privacyAccepted"
            {...agreementsForm.register("privacyAccepted")}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label htmlFor="privacyAccepted" className="text-sm font-medium">
              Privacy Policy
            </Label>
            <p className="text-sm text-gray-600">
              I agree to the privacy policy regarding the collection and use of my personal information.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="legalAccepted"
            {...agreementsForm.register("legalAccepted")}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label htmlFor="legalAccepted" className="text-sm font-medium">
              Egyptian Legal Framework
            </Label>
            <p className="text-sm text-gray-600">
              I acknowledge that this project complies with Egyptian laws and regulations governing crowdfunding and business operations.
            </p>
          </div>
        </div>

        {agreementsForm.formState.errors.termsAccepted && (
          <p className="text-sm text-red-500">{agreementsForm.formState.errors.termsAccepted.message}</p>
        )}
        {agreementsForm.formState.errors.privacyAccepted && (
          <p className="text-sm text-red-500">{agreementsForm.formState.errors.privacyAccepted.message}</p>
        )}
        {agreementsForm.formState.errors.legalAccepted && (
          <p className="text-sm text-red-500">{agreementsForm.formState.errors.legalAccepted.message}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Important Notice</p>
            <p>
              Your project will be reviewed by our admin team before approval. 
              This process typically takes 3-5 business days. You will be notified 
              via email once the review is complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Basic Project Information";
      case 2:
        return "Financial Documents";
      case 3:
        return "Project Milestones";
      case 4:
        return "Terms & Agreements";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Provide the basic information about your project.";
      case 2:
        return "Upload required financial documents for review.";
      case 3:
        return "Define project milestones and funding distribution.";
      case 4:
        return "Review and accept the terms and conditions.";
      default:
        return "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset everything when dialog closes
      resetAllForms();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {renderStepContent()}

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetAllForms();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={agreementsForm.handleSubmit(handleSubmit)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectWizard;
