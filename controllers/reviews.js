const Campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    try {
        const campground = await Campground.findById(req.params.id);
        if (!campground) {
            return res.status(404).json({ error: 'Campground not found' });
        }

        const review = new Review(req.body.review);
        review.author = req.user._id;
        campground.reviews.push(review);
        
        await review.save();
        await campground.save();

        res.status(201).json({ message: 'Created new review!', review });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    try {
        const campground = await Campground.findById(id);
        if (!campground) {
            return res.status(404).json({ error: 'Campground not found' });
        }

        await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        
        res.status(200).json({ message: 'Successfully deleted review' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
