const {
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
} = require("../services/team.service");
const { sendSuccess } = require("../utils/response.utils");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/businesses/:businessId/team
 */
const add = asyncHandler(async (req, res) => {
  const { fullName, username, phone, email, role } = req.body;
  const { businessId } = req.params;

  const member = await addTeamMember({
    businessId,
    fullName,
    username,
    phone,
    email,
    role,
    addedById: req.user.id,
  });

  return sendSuccess(res, {
    message: `${role} added successfully. Default password is: ${member.defaultPassword || username + "123"}`,
    data: member,
    statusCode: 201,
  });
});

/**
 * GET /api/businesses/:businessId/team
 */
const getAll = asyncHandler(async (req, res) => {
  const members = await getTeamMembers(req.params.businessId);

  return sendSuccess(res, {
    message: "Team members fetched successfully",
    data: members,
  });
});

/**
 * DELETE /api/businesses/:businessId/team/:businessUserId
 */
const remove = asyncHandler(async (req, res) => {
  const result = await removeTeamMember(
    req.params.businessUserId,
    req.params.businessId,
    req.user.id
  );

  return sendSuccess(res, {
    message: result.message,
  });
});

/**
 * PATCH /api/businesses/:businessId/team/:businessUserId
 */
const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const member = await updateTeamMemberRole(
    req.params.businessUserId,
    req.params.businessId,
    role
  );

  return sendSuccess(res, {
    message: "Team member role updated successfully",
    data: member,
  });
});

module.exports = { add, getAll, remove, updateRole };
