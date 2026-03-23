
const DEFAULT_LIMIT = 200;
const WINDOW_HOURS = 1;

export function rateLimitMessages(req, res, next) {
  const limit = Math.max(1, parseInt(process.env.RATE_LIMIT_MSG_PER_HOUR || '', 10) || DEFAULT_LIMIT);

  const checkAndNext = async () => {
    try {
      const { count, error } = await req.sb
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .gte('created_at', new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('[rateLimit]', error);
        return next();
      }

      if (count >= limit) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Maximum ${limit} messages per hour. Try again later.`,
        });
      }

      next();
    } catch (err) {
      console.error('[rateLimit]', err);
      next();
    }
  };

  checkAndNext();
}
