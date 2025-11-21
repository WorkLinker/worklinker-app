// Job Posting Management Handlers for Admin Page
// This file contains handler functions to keep admin/page.tsx cleaner

import { jobPostingService } from '@/lib/firebase-services';
import { logService } from '@/lib/firebase-services';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  [key: string]: unknown;
}

export const createJobPostingHandlers = (
  user: { email?: string } | null,
  setUpdating: (id: string | null) => void,
  loadJobPostings: () => Promise<void>,
  jobPostings: JobPosting[]
) => {
  // Approve job posting
  const handleApproveJobPosting = async (postingId: string) => {
    if (!confirm('Do you want to approve this job posting?')) return;

    try {
      setUpdating(postingId);
      
      const result = await jobPostingService.updateJobPostingStatus(postingId, 'approved');
      if (result.success) {
        // Create activity log
        const posting = jobPostings.find(p => p.id === postingId);
        if (user?.email && posting) {
          await logService.createLog({
            action: 'approve_job_posting',
            adminEmail: user.email,
            description: `Job posting approved: ${posting.title} by ${posting.company}`,
            timestamp: new Date()
          });
        }
        
        alert('Job posting has been approved!');
        await loadJobPostings(); // Refresh list
      }
    } catch (error: unknown) {
      console.error('❌ Job posting approval error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while approving job posting.';
      alert(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  // Reject job posting
  const handleRejectJobPosting = async (postingId: string) => {
    const reason = prompt('Please enter reason for rejection (optional):');
    if (reason === null) return; // If cancelled

    try {
      setUpdating(postingId);
      
      const result = await jobPostingService.updateJobPostingStatus(postingId, 'rejected', reason);
      if (result.success) {
        // Create activity log
        const posting = jobPostings.find(p => p.id === postingId);
        if (user?.email && posting) {
          await logService.createLog({
            action: 'reject_job_posting',
            adminEmail: user.email,
            description: `Job posting rejected: ${posting.title} by ${posting.company}. Reason: ${reason || 'No reason provided'}`,
            timestamp: new Date()
          });
        }
        
        alert('Job posting has been rejected.');
        await loadJobPostings(); // Refresh list
      }
    } catch (error: unknown) {
      console.error('❌ Job posting rejection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while rejecting job posting.';
      alert(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  // Delete job posting
  const handleDeleteJobPosting = async (postingId: string) => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;

    try {
      setUpdating(postingId);
      
      const result = await jobPostingService.deleteJobPosting(postingId);
      if (result.success) {
        // Create activity log
        const posting = jobPostings.find(p => p.id === postingId);
        if (user?.email && posting) {
          await logService.createLog({
            action: 'delete_job_posting',
            adminEmail: user.email,
            description: `Job posting deleted: ${posting.title} by ${posting.company}`,
            timestamp: new Date()
          });
        }
        
        alert('Job posting has been deleted.');
        await loadJobPostings(); // Refresh list
      }
    } catch (error: unknown) {
      console.error('❌ Job posting deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting job posting.';
      alert(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  return {
    handleApproveJobPosting,
    handleRejectJobPosting,
    handleDeleteJobPosting
  };
};

