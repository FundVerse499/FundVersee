import React, { useState } from "react";
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
import { Plus, Loader2 } from "lucide-react";

// ✅ form validation
const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  fundingGoal: z.string().min(1, "Funding goal is required"),
  legalEntity: z.string().min(1, "Legal entity is required"),
  contactInfo: z.string().email("Valid email is required"),
  category: z.string().min(1, "Category is required"),
  businessRegistration: z.string().min(1, "Business registration is required"),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface CreateProjectDialogProps {
  backendActor: FundVerseBackendService;
  onProjectCreated: () => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  backendActor,
  onProjectCreated,
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
  });

     // ✅ handle form submit
   const onSubmit = async (data: CreateProjectForm) => {
     setIsLoading(true);
     setSubmitError(null);

     try {
      // 1) convert goal -> e8s
      const fundingGoalE8s = Math.floor(parseFloat(data.fundingGoal) * 100_000_000);
      if (Number.isNaN(fundingGoalE8s) || fundingGoalE8s <= 0) {
        throw new Error("Funding goal must be a positive number");
      }

      // 2) nat8 for businessRegistration
      const businessRegNat8 = Number(data.businessRegistration) & 0xff;

      // 3) create idea (returns bigint)
      const ideaId: bigint = await backendActor.create_idea(
        data.title,
        data.description,
        BigInt(fundingGoalE8s),
        data.category,
        data.legalEntity,
        data.contactInfo,
        businessRegNat8
      );

      // 4) end date after 30 days
      const nowSecs = Math.floor(Date.now() / 1000);
      const endDateSecs = nowSecs + 30 * 24 * 60 * 60;

      // 5) create campaign
      const createRes = await backendActor.create_campaign(
        BigInt(ideaId),
        BigInt(fundingGoalE8s),
        BigInt(endDateSecs)
      );

      if ("Err" in createRes) {
        throw new Error(createRes.Err);
      }

      // ✅ success
      reset();
      setOpen(false);
      onProjectCreated();
         } catch (err: any) {
       console.error("Failed to create project/campaign:", err);
       console.error("Error details:", {
         name: err?.name,
         message: err?.message,
         stack: err?.stack,
         cause: err?.cause,
         toString: err?.toString()
       });
       
       let errorMessage = "Failed to create project";
       if (err?.message) {
         errorMessage = err.message;
       } else if (err?.toString) {
         errorMessage = err.toString();
       }
       
       setSubmitError(errorMessage);
     } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Project
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new funding project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input id="title" {...register("title")} placeholder="Enter project title" />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Describe your project"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fundingGoal">Funding Goal (ICP)</Label>
              <Input id="fundingGoal" type="number" step="0.00000001" {...register("fundingGoal")} placeholder="0.00" />
              {errors.fundingGoal && <p className="text-sm text-red-500">{errors.fundingGoal.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register("category")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalEntity">Legal Entity</Label>
            <Input id="legalEntity" {...register("legalEntity")} placeholder="Company or organization name" />
            {errors.legalEntity && <p className="text-sm text-red-500">{errors.legalEntity.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Email</Label>
            <Input id="contactInfo" type="email" {...register("contactInfo")} placeholder="your@email.com" />
            {errors.contactInfo && <p className="text-sm text-red-500">{errors.contactInfo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessRegistration">Business Registration Number</Label>
            <Input id="businessRegistration" {...register("businessRegistration")} placeholder="Enter registration number" />
            {errors.businessRegistration && <p className="text-sm text-red-500">{errors.businessRegistration.message}</p>}
          </div>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
