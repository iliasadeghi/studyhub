/** Teacher notes for Math, Biology and Computer Science (Markdown). */
export interface NoteSeed {
  classId: string;
  unit: string;
  title: string;
  content: string;
  daysAgo: number;
}

export const STEM_NOTES: NoteSeed[] = [
  {
    classId: 'c_math',
    unit: 'Unit 3 · Polynomials',
    title: 'Factoring Strategies',
    daysAgo: 6,
    content: `# Factoring Strategies

Factoring is *undoing* multiplication. Always work through these steps **in order**.

## Step 1 — Pull out the GCF

Look for the greatest common factor of every term first.

> **Example:** 6x³ + 9x² = 3x²(2x + 3)

## Step 2 — Count the terms

| Terms | Try this | Example |
|---|---|---|
| 2 | Difference of squares / cubes | x² − 25 = (x − 5)(x + 5) |
| 3 | Trinomial (ac-method) | x² + 7x + 12 = (x + 3)(x + 4) |
| 4 | Grouping | x³ + 2x² + 3x + 6 = (x² + 3)(x + 2) |

## Step 3 — The ac-method for ax² + bx + c

1. Multiply **a · c**.
2. Find two numbers that multiply to **ac** and add to **b**.
3. Split the middle term using those numbers.
4. Factor by grouping.

### Worked example: 2x² + 7x + 3

- a · c = 6 → the pair is **6 and 1** (6 · 1 = 6, 6 + 1 = 7)
- 2x² + 6x + x + 3
- 2x(x + 3) + 1(x + 3)
- **(2x + 1)(x + 3)** ✅

## Step 4 — Check!

Multiply your factors back out. If you get the original polynomial, you're done.

- [x] GCF first
- [x] Count terms
- [ ] Factor completely (keep going until nothing else factors)
`,
  },
  {
    classId: 'c_math',
    unit: 'Unit 3 · Polynomials',
    title: 'Polynomial Long & Synthetic Division',
    daysAgo: 4,
    content: `# Polynomial Division

## Long division

Works just like long division with numbers: **divide, multiply, subtract, bring down**.

Divide (x³ − 2x² − 4) by (x − 3):

\`\`\`text
        x²  +  x  +  3
      ________________
x − 3 | x³ − 2x² + 0x − 4
        x³ − 3x²
        ---------
              x² + 0x
              x² − 3x
              -------
                   3x − 4
                   3x − 9
                   ------
                        5   ← remainder
\`\`\`

Answer: **x² + x + 3 + 5/(x − 3)**

> ⚠️ Don't forget the placeholder **0x** when a power is missing!

## Synthetic division (shortcut)

Only works when dividing by **(x − k)**.

1. Write k and the coefficients.
2. Bring down the first coefficient.
3. Multiply by k, add to the next column. Repeat.

## Remainder Theorem

If you divide f(x) by (x − k), the remainder equals **f(k)**.

So in the example above, f(3) = 27 − 18 − 4 = **5** ✔️
`,
  },
  {
    classId: 'c_math',
    unit: 'Unit 2 · Quadratics',
    title: 'Graphing Parabolas',
    daysAgo: 20,
    content: `# Graphing Parabolas

![A parabola opening upward with its vertex, axis of symmetry and roots labeled](/notes/parabola.svg)

## Vertex form

**y = a(x − h)² + k**

- Vertex: **(h, k)**
- Axis of symmetry: **x = h**
- If **a > 0** the parabola opens up; if **a < 0** it opens down.
- |a| > 1 → narrower, |a| < 1 → wider.

## Standard form

**y = ax² + bx + c**

- Vertex x-coordinate: **x = −b / 2a**
- y-intercept: **(0, c)**

## The discriminant

| b² − 4ac | Number of real roots |
|---|---|
| > 0 | 2 |
| = 0 | 1 (vertex touches x-axis) |
| < 0 | 0 |

### Quick tips

1. Plot the vertex first.
2. Use symmetry — every point has a "twin" across the axis.
3. Label at least 5 points for full credit.
`,
  },
  {
    classId: 'c_bio',
    unit: 'Unit 5 · Energy in Cells',
    title: 'Photosynthesis Overview',
    daysAgo: 5,
    content: `# Photosynthesis

Plants convert light energy into chemical energy stored in glucose.

![Diagram of a chloroplast showing light reactions in the thylakoid and the Calvin cycle in the stroma](/notes/photosynthesis.svg)

## The overall equation

> 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂

## Two stages

### 1. Light-dependent reactions
- **Where:** thylakoid membranes
- **Inputs:** light, H₂O
- **Outputs:** O₂ (released), ATP, NADPH

### 2. Calvin cycle (light-independent)
- **Where:** stroma
- **Inputs:** CO₂, ATP, NADPH
- **Outputs:** glucose (G3P), ADP, NADP⁺

## Key vocabulary

| Term | Meaning |
|---|---|
| Chlorophyll | Green pigment that absorbs red & blue light |
| Stomata | Leaf pores for gas exchange |
| Carbon fixation | Turning CO₂ into organic molecules |

**Memory trick:** *"Light makes the batteries (ATP & NADPH), Calvin spends them."*
`,
  },
  {
    classId: 'c_bio',
    unit: 'Unit 5 · Energy in Cells',
    title: 'Cellular Respiration',
    daysAgo: 3,
    content: `# Cellular Respiration

The "reverse" of photosynthesis — cells break down glucose to make **ATP**.

> C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~36 ATP

## Three stages

| Stage | Location | ATP made | Needs O₂? |
|---|---|---|---|
| Glycolysis | Cytoplasm | 2 | No |
| Krebs cycle | Mitochondrial matrix | 2 | Yes (indirectly) |
| Electron transport chain | Inner mitochondrial membrane | ~32 | Yes |

## When there's no oxygen…

**Fermentation** lets glycolysis keep going:

- *Lactic acid fermentation* — your muscles during a sprint 🏃
- *Alcoholic fermentation* — yeast making bread rise 🍞

## Compare & contrast

- Photosynthesis **stores** energy; respiration **releases** it.
- Both use electron transport chains and make ATP.
- Products of one are the reactants of the other!
`,
  },
  {
    classId: 'c_bio',
    unit: 'Unit 4 · Cells',
    title: 'Cell Organelles Cheat Sheet',
    daysAgo: 14,
    content: `# Cell Organelles

## Both plant and animal cells

- **Nucleus** — holds DNA; the "control center"
- **Mitochondria** — makes ATP; the "powerhouse"
- **Ribosomes** — build proteins
- **Endoplasmic reticulum** — rough (with ribosomes) and smooth (lipids)
- **Golgi apparatus** — packages and ships proteins
- **Cell membrane** — controls what enters and leaves

## Plant cells only 🌱

- **Cell wall** — rigid support (cellulose)
- **Chloroplasts** — photosynthesis
- **Large central vacuole** — stores water, keeps the plant firm

## Animal cells only

- **Lysosomes** — digest waste (plants have some, but rarely)
- **Centrioles** — help with cell division

| Analogy | Organelle |
|---|---|
| City hall | Nucleus |
| Power plant | Mitochondria |
| Post office | Golgi |
| City border | Cell membrane |
`,
  },
  {
    classId: 'c_cs',
    unit: 'Unit 2 · Control Flow',
    title: 'Loops in Python',
    daysAgo: 9,
    content: `# Loops in Python

## \`for\` loops — when you know how many times

\`\`\`python
for i in range(5):
    print("Lap", i + 1)

fruits = ["apple", "mango", "kiwi"]
for fruit in fruits:
    print(fruit.upper())
\`\`\`

## \`while\` loops — until a condition changes

\`\`\`python
lives = 3
while lives > 0:
    guess = input("Guess the number: ")
    if guess == "7":
        print("You win!")
        break
    lives -= 1
\`\`\`

## Useful keywords

| Keyword | What it does |
|---|---|
| \`break\` | Exit the loop immediately |
| \`continue\` | Skip to the next iteration |
| \`range(a, b, step)\` | Numbers from a up to (not including) b |

> 💡 **Infinite loop?** Press **Ctrl + C** in the terminal to stop it, then check that your condition can actually become \`False\`.
`,
  },
  {
    classId: 'c_cs',
    unit: 'Unit 3 · Functions',
    title: 'Functions & Scope',
    daysAgo: 2,
    content: `# Functions & Scope

## Defining a function

\`\`\`python
def greet(name, excited=False):
    """Return a greeting for name."""
    message = f"Hello, {name}"
    return message + "!" if excited else message

print(greet("Ada"))            # Hello, Ada
print(greet("Ada", True))      # Hello, Ada!
\`\`\`

## Parameters vs. arguments

- **Parameter** — the variable in the definition (\`name\`)
- **Argument** — the value you pass in (\`"Ada"\`)

## Scope

Variables created **inside** a function only exist inside it.

\`\`\`python
score = 0          # global

def add_points():
    score = 10     # a *new* local variable!
    return score

add_points()
print(score)       # still 0
\`\`\`

### Best practice ✅

Pass values **in** as parameters and send results **out** with \`return\`. Avoid \`global\`.

This is exactly why your text-adventure inventory should be created once and passed into functions.
`,
  },
];
