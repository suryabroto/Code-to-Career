export const LEVELS = [
  {
    id: 1,
    title: "Level 1: Outputting Data",
    subtitle: "The print statement",
    careerTitle: "Script Apprentice",
    xpReward: 100,
    videoId: "rPZhLcaz16Y",
    badge: {
      name: "Output Pioneer",
      icon: "📣",
      desc: "Mastered printing text and numbers to the screen"
    },
    tasks: [
      {
        id: "1_1",
        title: "Print Hello World",
        description: "Let's start your coding journey! Use the `print()` function to output the text `\"Hello World\"` (make sure to include quotes around the text).",
        targetCode: 'print("Hello World")',
        defaultCode: '# Write your code below to print "Hello World"\n',
        validate: (output, variables, code) => {
          const trimmed = output.trim();
          if (trimmed !== "Hello World") {
            return "Expected output to be exactly 'Hello World'. Got: " + (trimmed || "nothing");
          }
          if (!code.includes("print")) {
            return "Make sure to use the print() function.";
          }
          return true;
        }
      },
      {
        id: "1_2",
        title: "Print Numbers & Math",
        description: "Great job! Next, we can print numbers directly without quotes, and even perform calculations inside `print()`. Type `print(2027)` or do a simple math calculation like `print(5 + 10)`.",
        targetCode: 'print(2027)\nprint(5 + 10)',
        defaultCode: '# Write your code below to print 2027 or a calculation\n',
        validate: (output, variables, code) => {
          const lines = output.trim().split("\n").map(l => l.trim());
          if (lines.includes("2027") || lines.includes("15")) {
            if (!code.includes("print")) {
              return "Make sure to use the print() function.";
            }
            return true;
          }
          return "Expected output to contain '2027' or the calculation result '15'. Got: " + (output || "nothing");
        }
      }
    ]
  },
  {
    id: 2,
    title: "Level 2: User Input",
    subtitle: "Interactive applications",
    careerTitle: "Logic Surveyor",
    xpReward: 150,
    videoId: "GtRC0cGF8S0",
    badge: {
      name: "Input Explorer",
      icon: "📥",
      desc: "Learned how to capture external inputs from users"
    },
    tasks: [
      {
        id: "2_1",
        title: "Capture User Input",
        description: "To make our programs interactive, we use the `input()` function. When running, the program will pause and wait for you to type something in the console. Type `input()` on its own and press Run. Try typing something in the terminal when prompted!",
        targetCode: 'input()',
        defaultCode: '# Call input() to prompt the user\n',
        validate: (output, variables, code) => {
          if (!code.replace(/\s/g, '').includes("input()")) {
            return "You must call the input() function.";
          }
          return true;
        }
      },
      {
        id: "2_2",
        title: "Print the Captured Input",
        description: "We can print user input directly by nesting the functions: `print(input())`. When the terminal prompts you, type a word (e.g., `\"Python\"`), and watch it print back to you!",
        targetCode: 'print(input("Enter something: "))',
        defaultCode: '# Read and print user input in a single statement\n',
        validate: (output, variables, code, testInputs, capturedInputs) => {
          if (!code.includes("input")) {
            return "You must capture input using input().";
          }
          if (!code.includes("print")) {
            return "You must print the captured input.";
          }
          if (capturedInputs.length === 0) {
            return "The program did not receive any input. Try typing in the terminal when prompted!";
          }
          const lastInput = capturedInputs[0];
          if (!output.includes(lastInput)) {
            return `Expected output to contain your entered input: '${lastInput}'. Got: '${output.trim()}'`;
          }
          return true;
        }
      }
    ]
  },
  {
    id: 3,
    title: "Level 3: Variables & Intro to Conditions",
    subtitle: "Storing state and starting checks",
    careerTitle: "Variables Squire",
    xpReward: 200,
    videoId: "GCt4tP2ECRA",
    badge: {
      name: "State Keeper",
      icon: "📦",
      desc: "Learned to declare variables and run simple logical statements"
    },
    tasks: [
      {
        id: "3_1",
        title: "Store Input in a Variable",
        description: "Variables store data so we can reuse it. Assign user input to a variable named `username`, and print a personalized message like `\"Hello \" + username`. Code example:\n`username = input(\"Enter your name: \")\nprint(\"Hello \" + username)`",
        targetCode: 'username = input("Enter name: ")\nprint("Hello " + username)',
        defaultCode: '# Store user input in a variable and print greeting\n',
        validate: (output, variables, code, testInputs, capturedInputs) => {
          if (!variables.hasOwnProperty("username")) {
            return "You must store the user input in a variable named 'username'.";
          }
          if (capturedInputs.length === 0) {
            return "The program didn't run the input prompt. Please run and type a name.";
          }
          const userVal = variables["username"];
          const expected = "Hello " + userVal;
          if (!output.toLowerCase().includes(expected.toLowerCase())) {
            return `Expected output to contain '${expected}'. Got: '${output.trim()}'`;
          }
          return true;
        }
      },
      {
        id: "3_2",
        title: "Intro to Conditions",
        description: "Conditional statements check if something is true using the `if` keyword. Create a variable `number = 15`. Under it, check if `number > 10` and if so, print `\"Greater\"`.\nMake sure to indent (press tab or type 4 spaces) the print statement under the `if`!",
        targetCode: 'number = 15\nif number > 10:\n    print("Greater")',
        defaultCode: '# Declare number and use a basic if condition\n',
        validate: (output, variables, code) => {
          if (!variables.hasOwnProperty("number")) {
            return "You need to declare the variable 'number'.";
          }
          if (Number(variables["number"]) !== 15) {
            return "Set variable 'number' to 15.";
          }
          if (!output.trim().includes("Greater")) {
            return "The output must print 'Greater' because 15 is greater than 10.";
          }
          if (!code.includes("if")) {
            return "You must use the 'if' statement to verify the condition.";
          }
          return true;
        }
      }
    ]
  },
  {
    id: 4,
    title: "Level 4: Master of Conditions",
    subtitle: "Complete branching logic",
    careerTitle: "Logic Knight",
    xpReward: 300,
    videoId: "BSWZXFIHYao",
    badge: {
      name: "Condition Knight",
      icon: "⚔️",
      desc: "Conquered multiple path conditional branching"
    },
    tasks: [
      {
        id: "4_1",
        title: "Multi-branch Grading System",
        description: "Now let's build a complete grading system. Get a score using: `score = int(input(\"Enter score: \"))`.\n- If the score is 90 or more, print `\"Grade A\"`.\n- Else if (`elif`) the score is 50 or more, print `\"Grade B\"`.\n- Otherwise (`else`), print `\"Grade F\"`.\nTest it with high values (e.g. 95), passing values (e.g. 70), and failing values (e.g. 30).",
        targetCode: 'score = int(input("Enter score: "))\nif score >= 90:\n    print("Grade A")\nelif score >= 50:\n    print("Grade B")\nelse:\n    print("Grade F")',
        defaultCode: '# Create a score grading program using input, if, elif, else\n',
        validate: (output, variables, code, testInputs, capturedInputs) => {
          if (!code.includes("if") || !code.includes("else")) {
            return "Make sure to use 'if' and 'else' conditional keywords.";
          }
          if (!code.includes("elif")) {
            return "Make sure to use 'elif' for the middle condition.";
          }
          if (capturedInputs.length === 0) {
            return "Run your program and type in a score.";
          }
          
          const val = Number(capturedInputs[0]);
          if (isNaN(val)) {
            return "Please type a numeric score in the terminal.";
          }

          if (val >= 90) {
            if (!output.includes("Grade A")) {
              return `For a score of ${val}, expected output to be 'Grade A'. Got: '${output.trim()}'`;
            }
          } else if (val >= 50) {
            if (!output.includes("Grade B")) {
              return `For a score of ${val}, expected output to be 'Grade B'. Got: '${output.trim()}'`;
            }
          } else {
            if (!output.includes("Grade F")) {
              return `For a score of ${val}, expected output to be 'Grade F'. Got: '${output.trim()}'`;
            }
          }
          return true;
        }
      }
    ]
  }
];
