const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");

/**
 * Add a new team member (Admin or Employee) to a business
 */
const addTeamMember = async ({ businessId, fullName, username, phone, email, role, addedById }) => {
  // Only ADMIN and EMPLOYEE roles can be added this way
  if (!["ADMIN", "EMPLOYEE"].includes(role)) {
    throw new Error("Invalid role. Can only add ADMIN or EMPLOYEE");
  }

  // Clean email — convert empty string to null
  const cleanEmail = email && email.trim() !== "" ? email.trim() : null;

  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    // If user exists, check if they are already in this business
    const alreadyInBusiness = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: existingUsername.id,
      },
    });

    if (alreadyInBusiness) {
      throw new Error("This user is already a member of this business");
    }

    // Add existing user to this business
    const businessUser = await prisma.businessUser.create({
      data: {
        businessId,
        userId: existingUsername.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            phone: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return businessUser;
  }

  // Check if email is already taken (only if email provided)
  if (cleanEmail) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      throw new Error("A user with this email already exists");
    }
  }

  // Create new user with a more secure default password pattern
  // In a production app, you should trigger a password reset email here
  const defaultPassword = `Biz@${username}${phone.slice(-4)}`;
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // Create user and add to business in one transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the user
    const newUser = await tx.user.create({
      data: {
        fullName,
        username,
        phone,
        email: cleanEmail,  // null if not provided
        passwordHash,
        role,
        mustChangePassword: true,
      },
    });

    // Link user to business
    const businessUser = await tx.businessUser.create({
      data: {
        businessId,
        userId: newUser.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            phone: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return businessUser;
  });

  return {
    ...result,
    defaultPassword,
  };
};

/**
 * Get all team members of a business
 */
const getTeamMembers = async (businessId) => {
  const members = await prisma.businessUser.findMany({
    where: { businessId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
          phone: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return members;
};

/**
 * Remove a team member from a business
 */
const removeTeamMember = async (businessUserId, businessId, requesterId) => {
  const businessUser = await prisma.businessUser.findFirst({
    where: {
      id: businessUserId,
      businessId,
    },
    include: {
      user: true,
    },
  });

  if (!businessUser) {
    throw new Error("Team member not found");
  }

  // Cannot remove yourself
  if (businessUser.userId === requesterId) {
    throw new Error("You cannot remove yourself from the business");
  }

  // Cannot remove a SUPERADMIN
  if (businessUser.role === "SUPERADMIN") {
    throw new Error("Cannot remove the business owner");
  }

  await prisma.businessUser.delete({
    where: { id: businessUserId },
  });

  return { message: "Team member removed successfully" };
};

/**
 * Update a team member role
 */
const updateTeamMemberRole = async (businessUserId, businessId, role) => {
  if (!["ADMIN", "EMPLOYEE"].includes(role)) {
    throw new Error("Invalid role. Can only set ADMIN or EMPLOYEE");
  }

  const businessUser = await prisma.businessUser.findFirst({
    where: {
      id: businessUserId,
      businessId,
    },
  });

  if (!businessUser) {
    throw new Error("Team member not found");
  }

  if (businessUser.role === "SUPERADMIN") {
    throw new Error("Cannot change the role of the business owner");
  }

  const updated = await prisma.businessUser.update({
    where: { id: businessUserId },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
          phone: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return updated;
};

module.exports = {
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
};