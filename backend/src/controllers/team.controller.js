const {
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
} = require("../services/team.service");
const { sendSuccess, sendError } = require("../utils/response.utils");

/**
 * POST /api/businesses/:businessId/team
 */
const add = async (req, res) => {
  try {
    const { fullName, username, phone, email, role } = req.body;
    const { businessId } = req.params;

    if (!fullName || !username || !phone || !role) {
      return sendError(res, {
        message: "Full name, username, phone and role are required",
        statusCode: 400,
      });
    }

    if (!["ADMIN", "EMPLOYEE"].includes(role)) {
      return sendError(res, {
        message: "Role must be either ADMIN or EMPLOYEE",
        statusCode: 400,
      });
    }

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
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not add team member",
      statusCode: 400,
    });
  }
};

/**
 * GET /api/businesses/:businessId/team
 */
const getAll = async (req, res) => {
  try {
    const members = await getTeamMembers(req.params.businessId);

    return sendSuccess(res, {
      message: "Team members fetched successfully",
      data: members,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not fetch team members",
      statusCode: 400,
    });
  }
};

/**
 * DELETE /api/businesses/:businessId/team/:businessUserId
 */
const remove = async (req, res) => {
  try {
    const result = await removeTeamMember(
      req.params.businessUserId,
      req.params.businessId,
      req.user.id
    );

    return sendSuccess(res, {
      message: result.message,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not remove team member",
      statusCode: 400,
    });
  }
};

/**
 * PATCH /api/businesses/:businessId/team/:businessUserId
 */
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return sendError(res, {
        message: "Role is required",
        statusCode: 400,
      });
    }

    const member = await updateTeamMemberRole(
      req.params.businessUserId,
      req.params.businessId,
      role
    );

    return sendSuccess(res, {
      message: "Team member role updated successfully",
      data: member,
    });
  } catch (error) {
    return sendError(res, {
      message: error.message || "Could not update team member role",
      statusCode: 400,
    });
  }
};

module.exports = { add, getAll, remove, updateRole };