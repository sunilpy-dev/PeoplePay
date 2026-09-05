import * as authService from '../services/authService.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const authData = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        token: authData.token,
        user: authData.user,
        permissions: authService.getRolePermissions(authData.user.role)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const permissions = authService.getRolePermissions(user.role);

    res.status(200).json({
      success: true,
      data: {
        user,
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
