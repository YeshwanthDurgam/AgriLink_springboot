import React, { useState } from 'react';
import './ReviewForm.css';

const ReviewForm = ({ onSubmit, onCancel, listingId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const reviewData = {
        rating,
        title: title.trim() || null,
        comment: comment.trim()
      };

      // Support both prop patterns
      if (onSubmit) {
        await onSubmit(reviewData);
      }
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    // Reset form state
    setRating(0);
    setTitle('');
    setComment('');
    setError('');
  };

  const isFormValid = rating > 0 && comment.trim().length > 0;

  return (
    <div className="review-form-container">
      <div className="review-form-header">
        <h3>Write a Review</h3>
        {onCancel && (
          <button 
            type="button" 
            className="close-btn"
            onClick={handleCancel}
            aria-label="Close review form"
          >
            ×
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label>Your Rating <span className="required">*</span></label>
          <div className="star-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
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
          <label htmlFor="review-comment">Your Review <span className="required">*</span></label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            maxLength={2000}
            required
          />
          <span className="char-count">{comment.length}/2000</span>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          {onCancel && (
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting || !isFormValid}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
