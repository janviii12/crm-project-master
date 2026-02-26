import crypto from 'crypto';
import User from '../models/User.js';

// In-memory stores for ephemeral data (use Redis for multi-server deployments)
const ephemeralTokens = new Map(); // token -> { userId, expiresAt }
const stealthMessages = []; // Array of messages

// Clean up expired tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of ephemeralTokens.entries()) {
    if (data.expiresAt < now) {
      ephemeralTokens.delete(token);
    }
  }
}, 60000);

// Generate cryptographically secure token
function generateStealthToken() {
  return crypto.randomBytes(32).toString('hex');
}

export const unlockStealth = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pin } = req.body;

    // Verify pin (hardcoded for now, could be env var)
    if (pin !== '0136') {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }

    // Get user to check entitlements
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has stealth access or is DevLead
    const hasStealthAccess = user.stealthAccess === true;
    const isDevLead = user.roles && user.roles.includes('DevLead');

    if (!hasStealthAccess && !isDevLead) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient privileges'
      });
    }

    // Check optional passphrase from env
    const requiredPassphrase = process.env.STEALTH_PASSPHRASE;
    if (requiredPassphrase && req.body.passphrase !== requiredPassphrase) {
      return res.status(401).json({
        success: false,
        message: 'Invalid passphrase'
      });
    }

    // Generate token
    const stealthToken = generateStealthToken();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Store token
    ephemeralTokens.set(stealthToken, {
      userId,
      expiresAt
    });

    res.json({
      success: true,
      stealthToken,
      expiresIn: 300 // seconds
    });

  } catch (error) {
    console.error('Stealth unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStealthMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const stealthToken = req.headers.authorization?.replace('Bearer ', '');

    // Validate token
    const tokenData = ephemeralTokens.get(stealthToken);
    if (!tokenData || tokenData.userId !== userId || tokenData.expiresAt < Date.now()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.json({
      success: true,
      messages: stealthMessages
    });

  } catch (error) {
    console.error('Get stealth messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export stores for use in socket handlers
export { ephemeralTokens, stealthMessages };
