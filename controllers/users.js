const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const { asyncHandler } = require('../middleware');
const { User, Fan } = require('../models');

// Get all users
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  const count = await User.countDocuments();

  res.status(200).json({ success: true, count, data: users });
});

// Get single user
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId).populate({
    path: 'followers',
    select: 'follower -_id -followed'
  });

  res.status(200).json({ success: true, data: user });
});

exports.profileImage = asyncHandler(async (req, res, next) => {
  const user = req.user.id;

  if (!req.files) {
    return next(new ErrorResponse(`Kindly upload a file`, 400));
  }

  const file = req.files.file;

  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  if (file.size > process.env.MAX_PROFILE_IMAGE_SIZE) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_PROFILE_IMAGE_SIZE}`,
        400
      )
    );
  }

  file.name = `photo_${user}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.log(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await User.findByIdAndUpdate(user, { photo: file.name });

    res.status(200).json({ sucess: true, data: file.name });
  });
});

// Follow a user
exports.follow = asyncHandler(async (req, res, next) => {
  const userToFollow = await User.findById(req.params.requesteduser);

  if (!userToFollow) {
    return next(new ErrorResponse(`User not found`, 404));
  }

  if (req.user.id === userToFollow.id) {
    return next(new ErrorResponse(`Can't follow self`, 400));
  } else if (
    await Fan.findOne({ follower: req.user.id, followed: userToFollow.id })
  ) {
    return next(new ErrorResponse(`Already following user`, 400));
  }

  const data = {
    follower: req.user,
    followed: userToFollow
  };
  await Fan.create(data);

  res.status(200).json({ success: true, data });
});

// Unfollow a user
exports.unfollow = asyncHandler(async (req, res, next) => {
  const userToUnfollow = await User.findById(req.params.requesteduser);

  if (!userToUnfollow) {
    return next(new ErrorResponse(`User not found`, 404));
  }

  const user = await User.findById(req.user.id);

  if (user.id === req.params.requesteduser) {
    return next(new ErrorResponse(`Can't unfollow self`, 400));
  } else if (user.following.includes(req.params.requesteduser)) {
    return next(new ErrorResponse(`Currently not following user`, 400));
  }

  user.following.pull(userToUnfollow);
  res.status(200).json({ success: true, data: user });
});


