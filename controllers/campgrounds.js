const Campground = require('../models/campground');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res) => {
    try {
        const campgrounds = await Campground.find({}).populate('popupText').populate('author');
        res.status(200).json(campgrounds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports.createCampground = async (req, res) => {
    try {
        const geoData = await geocoder.forwardGeocode({
            query: req.body.campground.location,
            limit: 1
        }).send();

        const campground = new Campground(req.body.campground);
        campground.geometry = geoData.body.features[0].geometry;
        campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        campground.author = req.user._id;
        await campground.save();

        res.status(201).json({ message: 'Successfully made a new campground!', campground });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.showCampground = async (req, res) => {
    try {
        const campground = await Campground.findById(req.params.id).populate({
            path: 'reviews',
            populate: { path: 'author' }
        }).populate('author');

        if (!campground) {
            return res.status(404).json({ error: 'Cannot find that campground!' });
        }

        res.status(200).json(campground);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports.renderEditForm = async (req, res) => {
    try {
        const campground = await Campground.findById(req.params.id);
        if (!campground) {
            return res.status(404).json({ error: 'Cannot find that campground!' });
        }
        res.status(200).json(campground);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;

    try {
        const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }, { new: true });

        if (req.files.length) {
            const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
            campground.images.push(...imgs);
        }

        if (req.body.deleteImages) {
            for (let filename of req.body.deleteImages) {
                await cloudinary.uploader.destroy(filename);
            }
            await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
        }

        await campground.save();
        res.status(200).json({ message: 'Successfully updated campground!', campground });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports.deleteCampground = async (req, res) => {
    try {
        const { id } = req.params;
        await Campground.findByIdAndDelete(id);
        res.status(200).json({ message: 'Successfully deleted campground' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
