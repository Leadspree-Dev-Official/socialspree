import React, { useState } from 'react';
import { GoogleReview, Tenant } from '../../types';
import { Star, MessageSquare, Sparkles, CheckCircle2, ThumbsUp, Send } from 'lucide-react';

interface GoogleReviewsViewProps {
  tenant: Tenant;
  reviews: GoogleReview[];
  onReplyReview: (reviewId: string, replyText: string) => void;
}

export const GoogleReviewsView: React.FC<GoogleReviewsViewProps> = ({
  tenant,
  reviews,
  onReplyReview
}) => {
  const [selectedReview, setSelectedReview] = useState<GoogleReview | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');

  const tenantReviews = reviews.filter(r => r.tenantId === tenant.id);
  const filteredReviews = starFilter === 'all' 
    ? tenantReviews 
    : tenantReviews.filter(r => r.rating === starFilter);

  const avgRating = tenantReviews.length > 0
    ? (tenantReviews.reduce((acc, r) => acc + r.rating, 0) / tenantReviews.length).toFixed(1)
    : '5.0';

  const handleGenerateAIReply = (rev: GoogleReview) => {
    const aiReplies = [
      `Thank you so much ${rev.authorName}! We're delighted you had a great experience with our team. Looking forward to serving you again!`,
      `Hi ${rev.authorName}, thank you for your feedback! We appreciate your support and strive for top quality service.`,
      `Dear ${rev.authorName}, we value your business! Thank you for taking the time to share your review.`
    ];
    setReplyInput(aiReplies[Math.floor(Math.random() * aiReplies.length)]);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !replyInput.trim()) return;

    onReplyReview(selectedReview.id, replyInput.trim());
    setSelectedReview(null);
    setReplyInput('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span>Google Reviews Management Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor Google Business customer ratings, analyze sentiment, and send instant AI-assisted responses.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 flex items-center gap-1">
              <span>{avgRating}</span>
              <div className="flex text-amber-400 text-sm">
                {'★'.repeat(5)}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Based on {tenantReviews.length} customer reviews
            </div>
          </div>
        </div>
      </div>

      {/* Star Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
        <button
          onClick={() => setStarFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            starFilter === 'all' ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Reviews ({tenantReviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            onClick={() => setStarFilter(stars)}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              starFilter === stars ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{stars} Stars</span>
            <span className="text-amber-400">★</span>
          </button>
        ))}
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {filteredReviews.map((rev) => (
          <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={rev.authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{rev.authorName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{rev.relativeTime}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-amber-400">
                {'★'.repeat(rev.rating)}
                <span className="text-xs font-bold text-slate-800 ml-1">({rev.rating}/5)</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
              "{rev.comment}"
            </p>

            {/* Existing Reply or Reply Action */}
            {rev.reply ? (
              <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-blue-900 font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Business Reply Published</span>
                  </span>
                  <span className="text-[10px] text-blue-700 font-mono">{rev.reply.repliedAt}</span>
                </div>
                <p className="text-slate-700 italic">{rev.reply.text}</p>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedReview(rev);
                    handleGenerateAIReply(rev);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Reply to Review</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0066FF]" />
                <span>Publish Google Review Reply</span>
              </h3>
              <button onClick={() => setSelectedReview(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700">
              <strong>Replying to {selectedReview.authorName}:</strong>
              <p className="italic mt-1 text-slate-600">"{selectedReview.comment}"</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Response Text</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAIReply(selectedReview)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" /> Regenerate AI Draft
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0066FF] text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Response</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
