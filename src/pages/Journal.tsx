import React, { useEffect, useState } from 'react';
import { useSession } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '../utils/clerkSupabase';
import PageMeta from '../components/common/PageMeta';
import ComponentCard from '../components/common/ComponentCard';
import CardSkeleton from '../components/common/CardSkeleton';

interface UserSummary {
  userId: string;
  username: string;
  journalCount: number;
  projectCount: number;
  tagCount: number;
  lastEntryDate: string;
}

const JournalPage: React.FC = () => {
  const { session, isLoaded } = useSession();
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      // Wait for Clerk to load the session
      return;
    }

    if (session) {
      const fetchSummaries = async () => {
        setLoading(true);
        const supabase = createClerkSupabaseClient(() => session.getToken({ template: 'supabase' }));
        try {
          // 1. Fetch all data concurrently
          const [journalsRes, projectsRes, tagsRes, profilesRes] = await Promise.all([
            supabase.from('journal_entries').select('user_id, entry_timestamp'),
            supabase.from('projects').select('user_id'),
            supabase.from('tags').select('user_id'),
            supabase.from('profiles').select('id, username'),
          ]);

          // 2. Check for errors
          if (journalsRes.error) throw journalsRes.error;
          if (projectsRes.error) throw projectsRes.error;
          if (tagsRes.error) throw tagsRes.error;
          if (profilesRes.error) throw profilesRes.error;

          const summaries: { [key: string]: UserSummary } = {};

          // Initialize with all profiles
          (profilesRes.data || []).forEach(profile => {
            summaries[profile.id] = {
              userId: profile.id,
              username: profile.username || profile.id,
              journalCount: 0,
              projectCount: 0,
              tagCount: 0,
              lastEntryDate: '',
            };
          });

          // Process journals
          (journalsRes.data || []).forEach(j => {
            if (!summaries[j.user_id]) { // User exists in journals but not profiles
              summaries[j.user_id] = { userId: j.user_id, username: j.user_id, journalCount: 0, projectCount: 0, tagCount: 0, lastEntryDate: '' };
            }
            summaries[j.user_id].journalCount++;
            if (j.entry_timestamp && (!summaries[j.user_id].lastEntryDate || new Date(j.entry_timestamp) > new Date(summaries[j.user_id].lastEntryDate))) {
              summaries[j.user_id].lastEntryDate = j.entry_timestamp;
            }
          });

          // Process projects
          (projectsRes.data || []).forEach(p => {
            if (!summaries[p.user_id]) {
              summaries[p.user_id] = { userId: p.user_id, username: p.user_id, journalCount: 0, projectCount: 0, tagCount: 0, lastEntryDate: '' };
            }
            summaries[p.user_id].projectCount++;
          });

          // Process tags
          (tagsRes.data || []).forEach(t => {
            if (!summaries[t.user_id]) {
              summaries[t.user_id] = { userId: t.user_id, username: t.user_id, journalCount: 0, projectCount: 0, tagCount: 0, lastEntryDate: '' };
            }
            summaries[t.user_id].tagCount++;
          });
          
          setUserSummaries(Object.values(summaries));

        } catch (error: unknown) {
          let message = 'An unknown error occurred while fetching data.';
          if (error instanceof Error) {
            message = error.message;
          } else if (error && typeof error === 'object' && 'message' in error) {
            message = String((error as { message: unknown }).message);
          }
          setError(message);
        } finally {
          setLoading(false);
        }
      };

      fetchSummaries();
    } else {
      // Clerk is loaded, but there's no session.
      // The ProtectedRoute should have already redirected.
      setLoading(false);
    }
  }, [session, isLoaded]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500 bg-red-100 border border-red-400 rounded p-4">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="User Journals | Bean Journal Admin"
        description="User journal summaries for Bean Journal Admin"
      />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="User Journal Summaries">
          {loading ? (
            <CardSkeleton />
          ) : userSummaries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userSummaries.map((summary) => (
                <div key={summary.userId} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h2 className="text-lg font-semibold truncate text-gray-900 dark:text-white" title={summary.username}>
                    User: <span className="font-normal text-gray-700 dark:text-gray-300">{summary.username}</span>
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Total Journals: <span className="font-medium text-gray-800 dark:text-gray-200">{summary.journalCount}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Projects: <span className="font-medium text-gray-800 dark:text-gray-200">{summary.projectCount}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Tags: <span className="font-medium text-gray-800 dark:text-gray-200">{summary.tagCount}</span>
                  </p>
                  {summary.journalCount > 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      Last Entry: <span className="font-medium text-gray-600 dark:text-gray-300">{new Date(summary.lastEntryDate).toLocaleString()}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500 dark:text-gray-400">No journal entries found to summarize.</p>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default JournalPage; 