# PLACEMENT TREE SPECIFICATION

The Placement Tree governs 7-position board unit filling, position traversal, and auto placement.

## Position Mapping
- Position 0: Top (Root of Board Unit)
- Position 1: Middle Left
- Position 2: Middle Right
- Position 3: Bottom Left 1
- Position 4: Bottom Left 2
- Position 5: Bottom Right 1
- Position 6: Bottom Right 2

## Deterministic Filling Algorithm
Positions are filled strictly in the order:
$$\text{TOP} \rightarrow \text{BOTTOM}, \quad \text{LEFT} \rightarrow \text{RIGHT}$$

Internal traversal array: `[0, 2, 1, 6, 5, 4, 3]`.

## Placement Preference Order
1. **Manual Placement (Board 1 only)**: Target Placement ID validated for eligibility and open position.
2. **Auto Placement (Board 1)**:
   - Check Sponsor's active Board 1 unit. If open, insert into sponsor's board unit.
   - Otherwise, fallback to the oldest active Board 1 unit (`boardId` ascending).
3. **Auto Placement (Boards 2–5)**: Manual placement disabled. Uses automatic placement preference algorithm.
