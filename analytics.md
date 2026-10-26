# Bookworm Analytics Ideas

Ideas grounded in the current Mongoose models, not an implementation specification.

## Product Direction: Simple Reading Insights

This is a personal reading companion, not a statistics dashboard. Focus on questions an everyday reader can answer at a glance:

- How many books have I finished this year?
- What did I finish each month?
- What am I reading, and what is waiting on my shelf?
- Which books did I enjoy most?
- Which authors and categories do I read most often?

Prefer plain labels such as "Books finished" and "Your favorite books". Avoid scatter plots, statistical distributions, predictive scores, and elaborate comparisons. A useful number or short book list is often better than another chart.

## Recommended Libraries

**Recommendation: Recharts for the few charts we actually need.** It offers React components for bar charts, responsive containers, axes, and tooltips, and can be styled to match Bookworm's CSS variables. Start with one monthly bar chart rather than introducing a large dashboard framework.

| Need                                  | Suggested Tool                                                       | Reason                                                            |
| ------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Books finished per month              | [Recharts](https://recharts.org/)                                    | A straightforward labeled bar chart                               |
| Top authors or categories             | CSS bars and text initially; Recharts if interaction becomes useful  | A short ranked list may already communicate everything            |
| Shelf counts and collection progress  | Existing React components and CSS; native progress where appropriate | No chart library needed for counts or "3 of 8 books read"         |
| Highest-rated books                   | Existing book covers and rating components                           | Readers recognize their books more readily than an abstract chart |
| Date labels and calendar calculations | Existing date-fns dependency plus Intl.DateTimeFormat                | Reuse the current toolchain and support English/Greek labels      |

Do not install multiple chart libraries. Chart.js with react-chartjs-2 is a reasonable canvas-based alternative, but there is no clear need for it alongside Recharts for this scope. Check the chosen library release's React peer dependencies before installing it in this project.

### Next.js and Accessibility Notes

- Calculate user-scoped totals on the server and pass small, ready-to-display datasets to charts.
- Keep interactive charts in focused Client Components rather than making the entire analytics page client-rendered.
- Give responsive chart containers a stable height so they render reliably and do not shift the page.
- Use visible labels and readable counts, with a text summary or accessible data table. Do not make hover tooltips or color the only way to understand a chart.
- Keep charts readable on mobile, use the existing theme tokens, and avoid unnecessary animation.
- No dependency installation or chart implementation is part of this document update.

## Available Data

- **UserBook:** shelf/status, start and finish dates, collection membership, rating, review, tags, and timestamps.
- **Book:** title, authors, categories, page count, publication date, and catalog source.
- **Collection:** the user's custom collection names and memberships.

The current UserBook model does **not** store current page, reading sessions, daily activity, reading time, rereads, or status history. A saved date range describes when a book was in progress, not proof that the user read every day within it.

## 1. At-a-Glance Overview

These are good candidates for the first analytics screen:

| Insight                   | Meaning                                                           | Suggested Display                     |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| Books completed this year | Books marked Read with a finish date in the selected year         | Summary number                        |
| Pages in completed books  | Sum of known page counts for those completed books                | Summary number                        |
| Currently reading         | Number of books on the Currently Reading shelf                    | Summary number with link to the shelf |
| Average rating            | Average of recorded ratings, with the number of rated books shown | Summary number                        |
| Library read percentage   | Books on Read divided by all saved books                          | Progress bar                          |
| Shelf breakdown           | Counts for To Read, Currently Reading, Read, and Did Not Finish   | Horizontal bars                       |

Keep lifetime library snapshots separate from selected-period statistics. For example, "Currently reading" is today's saved state, while "Books completed this year" is a dated completion metric.

## 2. Reading Over Time

- **Books completed per month:** a bar chart based on finish dates. Include zero-completion months rather than skipping them.
- **Pages in books completed per month:** a companion chart that adds context when one month contains a few long books and another contains many short ones. These are pages attributed to completion month, not pages actually read during that month.
- **Best completion month:** the month with the most finished books; optionally show the month with the most known completed-book pages separately.
- **Completion calendar:** mark dates on which books were finished. Label it as a completion calendar, not a daily reading-activity heatmap.
- **Time since last completion:** show the most recent finish date without treating a long gap as a failure.

## 3. Book Length and Reading Duration

- **Longest and shortest completed books:** show the covers, titles, and known page counts.
- **Reading dates on individual books:** show when a book was started and finished, with a plain calendar-day duration if both dates are valid. No comparison chart is needed.
- **Currently-reading age:** days since the start date for each active book. Missing start dates should remain unknown, not become zero.

For calendar-duration calculations, count a same-day start and finish as one calendar day and reject finish dates before start dates. Do not describe page count divided by calendar duration as measured reading speed.

## 4. Taste and Preferences

- **Most-read authors:** rank authors by completed-book count, with links back to filtered library results.
- **Most-read categories:** show which categories appear most often among completed books.

Start with the top three to five authors or categories and plain counts, such as "Ursula K. Le Guin - 4 books". More elaborate preference scores are unnecessary.

Author names and categories need normalization before these become reliable. Provider categories can contain aliases, duplicates, and catalog-specific labels. Start with simple count breakdowns; avoid confident personalized conclusions from sparse or noisy metadata.

## 5. Ratings and Reviews

- **Average rating:** an optional familiar star value, showing how many books have been rated.
- **Highest-rated books:** a cover grid of personal favorites, with a stable tie-breaker such as finish date or title.
- **Books awaiting reflection:** completed books missing a rating or review, presented as an optional actionable list rather than a requirement.

Avoid automated sentiment or personality claims from reviews in the initial version. Simple personal summaries are more transparent and useful.

## 6. To-Read Shelf and Unfinished Books

- **To-read shelf size:** current number of books waiting to be read.
- **Pages on the to-read shelf:** sum of known page counts, with unknown lengths acknowledged.
- **Oldest saved to-read books:** rank by the user's library-entry creation date. This means time since adding the book, not necessarily time spent on that shelf.
- **Recently added books:** a short list based on UserBook creation time.
- **Did Not Finish count:** show the current saved count and optionally compare its authors, categories, and lengths with completed books.

Do not claim a historical DNF trend: there is no dedicated abandonment date or status history. Likewise, the exact past size of the to-read shelf cannot be reconstructed from its current state.

## 7. Custom Collection Insights

- **Books per collection:** quick comparison of collection sizes.
- **Read percentage per collection:** Read books divided by all saved books belonging to that collection.
- **Pages in completed books per collection:** useful for collections such as "Classics" or "Book club".
- **Unassigned books:** count and link to books with no collection, making collection management more useful.

The database allows multiple collection IDs per book even though the current selection UI uses one. Do not double-count books in overall totals; collection totals can overlap. Current memberships and names do not establish historical membership.

## 8. Data Quality and Honest Empty States

Analytics should expose enough context to avoid misleading precision:

- Show how many Read books lack finish dates and are excluded from time-based charts.
- Show how many completed books lack usable page counts; page totals cover only books with known lengths.
- Treat a page count of zero as unknown, not as a genuinely zero-page book.
- Show how many books have both valid reading dates before calculating duration statistics.
- Keep unrated books out of rating averages rather than treating them as zero stars.
- Distinguish an empty library, no completions in a period, and insufficient metadata for a particular insight.
- Offer links to edit incomplete entries where practical instead of filling charts with invented values.

## Recommended First Release

Build a compact analytics page in this order:

1. **Summary:** books finished this year, known pages in those books, and currently reading. Average rating is optional.
2. **Reading over time:** monthly completions with a year selector.
3. **Your library:** simple shelf counts and overall read percentage.
4. **Your favorites:** a short list of highest-rated books with covers.

Keep top authors/categories, collection progress, longest/shortest books, and the completion calendar as optional follow-ups. The first page needs only one chart; everything else can be clear numbers, progress bars, and book lists.

Start with a year selector and an All Time option. Add collection filtering only if people need it. Clearly label snapshot panels that cannot follow a historical date filter. Where a filter applies, apply it consistently to both a metric's numerator and denominator.

## Ideas That Need Additional Data

| Future Insight                                       | Additional Data Needed                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Current reading progress and remaining pages         | A current-page value on UserBook                                                    |
| Actual pages read per day or week                    | Dated progress logs or reading sessions; a current-page value alone is insufficient |
| Daily reading heatmap and reading streaks            | Explicit dated reading activity                                                     |
| Reading time and pages per hour                      | Timed sessions with page deltas                                                     |
| Annual reading-goal progress                         | A user-defined goal and target period                                               |
| Exact historical shelf growth and shelf transitions  | Status/membership events and a policy for removed entries                           |
| Reread counts and per-reading durations              | Separate reading instances for the same user and book                               |
| Purchase spending, ownership, and borrowing patterns | Explicit acquisition, price/currency, ownership, and loan fields                    |
| Formats or language preferences                      | Book-format and language metadata                                                   |

These should be optional future extensions, not inferred from timestamps or book categories.

## Calculation Guardrails

- Scope every query to the authenticated user. The global Book catalog is not the user's reading history.
- Use UserBook.createdAt for when the user added a book, not Book.createdAt, which describes catalog creation.
- Use Read status plus a valid finishedAt for dated completion metrics. Do not count an arbitrary finish date on a different shelf as a completion.
- Use an explicit reporting timezone and consistent period boundaries for daily/monthly grouping. Avoid letting the server's timezone silently define a user's calendar.
- Treat startedAt and finishedAt as user-editable dates, not immutable activity events. Auto-filled dates can reflect shelf changes rather than exact reading activity.
- Do not interpret updatedAt as a reading session, finish event, or historical rating date.
- Explain that statistics reflect currently saved entries. Permanently removing a library entry also removes its contribution to analytics; there is no retained reading history today.
- Exclude future or inconsistent dates from retrospective completion/duration metrics and report them as data-quality issues.
- Keep multi-author, multi-category, and multi-collection attribution explicit: a book may contribute to several breakdown groups, but only once to overall book totals.
- Prefer counts and descriptive observations over predictions when the sample is small.
