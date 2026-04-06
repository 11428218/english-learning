# Spaced Repetition Implementation

## Overview

DuoLingual uses a simplified SM-2 (Super Memo) algorithm for optimal spacing of learning reviews. This proven algorithm adapts review intervals based on user performance.

## Algorithm Details

### Core Concept

The SM-2 algorithm works by:
1. Tracking performance on each word
2. Adjusting the "ease factor" (difficulty multiplier)
3. Calculating optimal review intervals

### Ease Factor (EF)

**Definition**: Determines how quickly the interval increases after correct answers.

**Calculation**:
```
EF' = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
EF' = max(1.3, EF')  // Minimum ease factor of 1.3
```

Where quality is 0-5 (based on user response)

### Review Intervals

**Initial intervals**:
- 1st review: Immediately after learning
- 2nd review: 1 day later
- 3rd review: 3 days later
- 4th+ review: Based on ease factor

**Interval calculation**:
```
If correct:
  interval = previous_interval * ease_factor
  
If wrong:
  interval = 1 (reset to 1 day)
  ease_factor -= 0.2 (min 1.3)
```

## Quality Ratings

The algorithm uses a 6-point quality scale:

| Score | Rating | Meaning |
|-------|--------|---------|
| 0 | Wrong | Complete failure, interval resets |
| 1 | Wrong | Wrong answer but recognized something |
| 2 | Wrong | Wrong despite knowing what it is |
| 3 | Pass | Correct but with difficulty |
| 4 | Good | Correct and instant recall |
| 5 | Perfect | Correct and immediate response |

## Implementation in DuoLingual

### Review Decision

Words are queued for review when:
```sql
next_review_date <= NOW()
```

### Recording Answer

When user answers a question:
1. Calculate quality based on correctness
2. Update ease_factor
3. Calculate new interval
4. Set next_review_date
5. Record in history for analytics

### Database Fields

Per `user_words` table:
- `next_review_date`: When to review next
- `review_interval`: Current interval in days
- `ease_factor`: Current EF (default 2.5)
- `correct_streak`: Consecutive correct answers
- `total_reviews`: Lifetime reviews
- `times_correct`: Correct answer count

## Performance Characteristics

### Typical Learning Curve

For a new word with EF=2.5:

| Review | Performance | Interval | Next Review |
|--------|-------------|----------|------------|
| 1 | Correct | 1 day | Tomorrow |
| 2 | Correct | 3 days | In 3 days |
| 3 | Correct | 7.5 days | In ~1 week |
| 4 | Correct | ~19 days | In ~3 weeks |
| 5 | Correct | ~47 days | In ~6-7 weeks |

### Reset Scenario

If word has EF=3.0, interval=47:
- User gets it wrong
- EF reduced to 2.8
- Interval reset to 1 day
- Reviewed again tomorrow

## Optimization Tips

### For Learners

1. **Target 85-90% accuracy**: Optimal difficulty level
2. **Daily reviews**: Consistent practice beats cramming
3. **Focus on weak words**: Words with EF < 2.0 need more practice
4. **Avoid long gaps**: Review before interval expires for best results

### For System

1. **Monitor ease distribution**: Average EF shows difficulty level
2. **Identify problematic words**: Words with low EF and high error rate
3. **Adjust domains**: If one domain averages high EF, consider harder content
4. **Track accuracy trends**: Should improve over time

## Advanced Features (Future)

- [ ] Variable quality detection from confidence ratings
- [ ] Category-based intervals (learn related concepts together)
- [ ] Time-of-day optimization (review when most alert)
- [ ] Predictive modeling (estimate retention probability)
- [ ] Export interval data for analysis

## Research References

- [Forgetting Curve - Hermann Ebbinghaus](https://en.wikipedia.org/wiki/Forgetting_curve)
- [SM-2 Algorithm - SuperMemo](https://super-memory.com/articles/20rules.htm)
- [Spaced Repetition in Education](https://www.gwern.net/Spaced-repetition)

## Testing the Algorithm

### Simulated Learning Path

```bash
# Day 1: Learn word "comprehensive"
POST /words/user/add
→ next_review_date = TODAY, interval = 1, EF = 2.5

# Day 1: First review
GET /review/today
POST /review/answer { is_correct: true }
→ next_review_date = +1 day, interval = 1, EF = 2.5

# Day 2: Second review
GET /review/today
POST /review/answer { is_correct: true }
→ next_review_date = +3 days, interval = 3, EF = 2.5

# Day 5: Third review
GET /review/today
POST /review/answer { is_incorrect: true }
→ next_review_date = +1 day, interval = 1, EF = 2.3

# Day 6: Reset and retry
GET /review/today
POST /review/answer { is_correct: true }
→ next_review_date = +1 day, interval = 1, EF = 2.3
```

## Troubleshooting

### Issue: Words reviewed too frequently

**Cause**: Ease factor not increasing (users struggling with difficulty)

**Solution**: 
- Check if content is too hard
- Provide more context/examples
- Reduce word difficulty level

### Issue: Words not appearing in review queue

**Cause**: `next_review_date` is in the future

**Solution**:
- Check database query
- Verify server timezone
- Manually adjust `next_review_date` for testing

### Issue: Inconsistent intervals

**Cause**: EF calculation errors

**Solution**:
- Verify EF stays >= 1.3
- Check formula implementation
- Review database update statements

