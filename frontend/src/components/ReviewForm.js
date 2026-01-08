import React, { useState, useEffect } from 'react';
import reviewService from '../services/reviewService';
import './ReviewForm.css';

const ReviewForm = ({ listingId, onReviewSubmitted }) => {
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCanReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const checkCanReview = async () => {
    try {
      setLoading(true);
      const response = await reviewService.canReview(listingId);
      setCanReview(response?.success && response.data === true);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await reviewService.createReview(listingId, {
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null
      });

      setSuccess(true);
      setCanReview(false);
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="review-form-loading">Checking review eligibility...</div>;
  }

  if (success) {
    return (
      <div className="review-form-success">
        <span className="success-icon">✓</span>
        <h4>Thank you for your review!</h4>
        <p>Your review has been submitted successfully.</p>
      </div>
    );
  }

  if (!canReview) {
    return null;
  }

  return (
    <div className="review-form-container">
      <h3>Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label>Your Rating *</label>
          <div className="star-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                ★
              </button>
            ))}
            <span className="rating-text">
              {rating > 0 && ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="review-title">Review Title (optional)</label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label htmlFor="review-comment">Your Review (optional)</label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            maxLength={2000}
          />
          <span className="char-count">{comment.length}/2000</span>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button 
          type="submit" 
          className="submit-btn"
          disabled={submitting || rating === 0}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
