import React, { useState, useEffect } from 'react';
import reviewService from '../services/reviewService';
import './ReviewList.css';

const StarRating = ({ rating, size = 'medium' }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span 
        key={i} 
        className={`star ${size} ${i <= rating ? 'filled' : 'empty'}`}
      >
        ★
      </span>
    );
  }
  return <div className="star-rating">{stars}</div>;
};

const RatingDistribution = ({ distribution, totalReviews }) => {
  const ratings = [5, 4, 3, 2, 1];
  
  return (
    <div className="rating-distribution">
      {ratings.map(rating => {
        const count = distribution[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        return (
          <div key={rating} className="rating-bar">
            <span className="rating-label">{rating} ★</span>
            <div className="bar-container">
              <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
            </div>
            <span className="rating-count">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

const ReviewCard = ({ review, onHelpful }) => {
  const [helpfulClicked, setHelpfulClicked] = useState(false);

  const handleHelpful = async () => {
    if (helpfulClicked) return;
    try {
      await onHelpful(review.id);
      setHelpfulClicked(true);
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="reviewer-details">
            <span className="reviewer-name">{review.reviewerName || 'Anonymous User'}</span>
            {review.isVerifiedPurchase && (
              <span className="verified-badge">✓ Verified Purchase</span>
            )}
          </div>
        </div>
        <div className="review-date">{formatDate(review.createdAt)}</div>
      </div>
      
      <div className="review-rating">
        <StarRating rating={review.rating} size="small" />
        {review.title && <span className="review-title">{review.title}</span>}
      </div>
      
      {review.comment && (
        <p className="review-comment">{review.comment}</p>
      )}
      
      <div className="review-footer">
        <button 
          className={`helpful-btn ${helpfulClicked ? 'clicked' : ''}`}
          onClick={handleHelpful}
          disabled={helpfulClicked}
        >
          👍 Helpful ({review.helpfulCount + (helpfulClicked ? 1 : 0)})
        </button>
      </div>
    </div>
  );
};

const ReviewList = ({ listingId, sellerId }) => {
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchReviews();
    if (listingId) {
      fetchRatingSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, sellerId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let response;
      if (listingId) {
        response = await reviewService.getListingReviews(listingId, page);
      } else if (sellerId) {
        response = await reviewService.getSellerReviews(sellerId, page);
      }
      
      if (response?.success && response.data) {
        setReviews(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingSummary = async () => {
    try {
      const response = await reviewService.getListingRating(listingId);
      if (response?.success && response.data) {
        setRatingSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching rating summary:', error);
    }
  };

  const handleHelpful = async (reviewId) => {
    await reviewService.markHelpful(reviewId);
  };

  if (loading && reviews.length === 0) {
    return <div className="reviews-loading">Loading reviews...</div>;
  }

  return (
    <div className="review-list-container">
      {ratingSummary && (
        <div className="rating-summary">
          <div className="average-rating">
            <span className="rating-number">{ratingSummary.averageRating?.toFixed(1) || '0.0'}</span>
            <StarRating rating={Math.round(ratingSummary.averageRating || 0)} />
            <span className="total-reviews">{ratingSummary.totalReviews || 0} reviews</span>
          </div>
          <RatingDistribution 
            distribution={ratingSummary.distribution || {}} 
            totalReviews={ratingSummary.totalReviews || 0} 
          />
        </div>
      )}

      <div className="reviews-list">
        <h3>Customer Reviews</h3>
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map(review => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              onHelpful={handleHelpful}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
