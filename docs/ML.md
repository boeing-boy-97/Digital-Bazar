# ML - Digital Bazar

## Overview
Separate ML/analytics service for forecasting and recommendations, modular from core commerce.

## Forecasting

### Baseline Model (Current)
- Inputs: historical order data (orderItems, orders), current inventory, recent sales, avg daily sales, day of week, seasonality
- Logic:
  - Avg daily sales = total sold last 30 days / 30
  - Days left = available stock / avg daily
  - If days left < 7 → low stock alert
  - Demand trend: compare last 7 days vs previous 7 days → % change
  - Confidence based on data coverage: <10 orders low confidence, 10-50 medium, 50+ high
  - Fallback to simple threshold when insufficient data

### Example Outputs
- "Cement demand may be higher next week (+23%) based on recent sales. Confidence: 68% • Data: 45 orders"
- "PVC Pipe 1 inch may run out in ~4 days at current rate (12/day avg). Suggest restock 100 units. Confidence: 72%"

### Future: Advanced Model
- Python service with scikit-learn
- Features: day_of_week, month, category, stock availability, promotions, seasonality, local events
- Models: Prophet, ARIMA, or LightGBM for demand
- Outputs: projected demand, confidence interval, suggested restock date
- Training pipeline: event records product_view, search, add_to_cart, order_created, order_completed
- Cold start: shop-level averages, category baseline, conservative restock

## Recommendations

### Current: Deterministic + Business Logic
- Popular products in shop (order count)
- Category affinity: if customer bought plumbing, recommend plumbing
- Collaborative: customers who bought X also bought Y (orderItem co-occurrence)
- Never recommend unavailable products (stock >0, isActive)
- Cold start: popular products in selected shop, category popularity

### Future: ML
- Embeddings for products (text-embedding-3-small) + user embeddings
- Matrix factorization
- Real-time: view history, cart, search
- A/B testing

## Smart Reorder
- When predicted demand > current inventory → alert
- Shows: expected stock-out date, suggested reorder qty (avg daily * 7 + safety stock), recent sales trend
- Adjustable by shopkeeper

## Review Analysis (Future)
- Summarize reviews: positive themes, negative themes, common complaints, preparation problems
- Use OpenAI to cluster review texts, not replace original

## Fraud/Abuse Detection
- Risk scoring for suspicious behavior:
  - Impossible order patterns (1000 cement bags in 1 min)
  - Repeated payment failures
  - Unusual account activity
  - Abuse of promotions (same code 10x)
  - Suspicious refund behavior
- Score flags for admin review, not auto punish

## Data Pipeline
- Event model: event_name, actor, shop_id, customer_id where permitted, order_id, timestamp, metadata
- Privacy and consent respected
- Stored in audit_logs + dedicated analytics events (future)
- Training data separate from transactional

## Observability
- Log model, latency, token usage, tool calls, errors, success/failure, request type
- Do not log sensitive PII unnecessarily
- Track forecasting accuracy over time

## Cost Control
- Request limits, token limits, caching where safe, model routing (cheaper for simple tasks), timeouts, retries, fallback

## Separation
- lib/ai/ for assistant, search, categorization, vision, voice, recommendations, forecasting
- services/ml/ future Python service
- Core commerce works without AI - AI is enhancement layer
