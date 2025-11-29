import pool from './db.js';

export interface AIUsageRecord {
  id?: number;
  user_email: string;
  operation_type: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  model_used?: string;
  success?: boolean;
  error_message?: string;
  created_at?: Date;
}

export interface UsageStats {
  total_operations: number;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  operations_by_type: {
    operation_type: string;
    count: number;
    total_tokens: number;
  }[];
  recent_usage: AIUsageRecord[];
}

// Track AI usage
export async function trackAIUsage(usage: AIUsageRecord): Promise<void> {
  const query = `
    INSERT INTO ai_usage (
      user_email,
      operation_type,
      input_tokens,
      output_tokens,
      total_tokens,
      model_used,
      success,
      error_message
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;

  await pool.query(query, [
    usage.user_email,
    usage.operation_type,
    usage.input_tokens || 0,
    usage.output_tokens || 0,
    usage.total_tokens || 0,
    usage.model_used || 'gemini-1.5-flash',
    usage.success !== false,
    usage.error_message || null,
  ]);
}

// Get user's AI usage statistics
export async function getUserUsageStats(userEmail: string, days: number = 30): Promise<UsageStats> {
  // Get total stats
  const totalQuery = `
    SELECT
      COUNT(*) as total_operations,
      COALESCE(SUM(total_tokens), 0) as total_tokens,
      COALESCE(SUM(input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(output_tokens), 0) as total_output_tokens
    FROM ai_usage
    WHERE user_email = $1
      AND created_at >= NOW() - INTERVAL '${days} days'
  `;

  const totalResult = await pool.query(totalQuery, [userEmail]);

  // Get stats by operation type
  const byTypeQuery = `
    SELECT
      operation_type,
      COUNT(*) as count,
      COALESCE(SUM(total_tokens), 0) as total_tokens
    FROM ai_usage
    WHERE user_email = $1
      AND created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY operation_type
    ORDER BY total_tokens DESC
  `;

  const byTypeResult = await pool.query(byTypeQuery, [userEmail]);

  // Get recent usage (last 10 records)
  const recentQuery = `
    SELECT *
    FROM ai_usage
    WHERE user_email = $1
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const recentResult = await pool.query(recentQuery, [userEmail]);

  return {
    total_operations: parseInt(totalResult.rows[0].total_operations),
    total_tokens: parseInt(totalResult.rows[0].total_tokens),
    total_input_tokens: parseInt(totalResult.rows[0].total_input_tokens),
    total_output_tokens: parseInt(totalResult.rows[0].total_output_tokens),
    operations_by_type: byTypeResult.rows.map(row => ({
      operation_type: row.operation_type,
      count: parseInt(row.count),
      total_tokens: parseInt(row.total_tokens),
    })),
    recent_usage: recentResult.rows,
  };
}

// Get all users' usage stats (admin view)
export async function getAllUsersUsageStats(days: number = 30) {
  const query = `
    SELECT
      user_email,
      COUNT(*) as total_operations,
      COALESCE(SUM(total_tokens), 0) as total_tokens,
      COALESCE(SUM(input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(output_tokens), 0) as total_output_tokens
    FROM ai_usage
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY user_email
    ORDER BY total_tokens DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

// Delete old usage records (cleanup)
export async function deleteOldUsageRecords(days: number = 90): Promise<number> {
  const query = `
    DELETE FROM ai_usage
    WHERE created_at < NOW() - INTERVAL '${days} days'
  `;

  const result = await pool.query(query);
  return result.rowCount || 0;
}
