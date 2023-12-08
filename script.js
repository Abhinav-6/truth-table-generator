const formEle = document.querySelector("#ff");
const inputEle = document.querySelector("#expression");
const tableEle = document.querySelector("#table-element");
let errorElemnt = document.querySelector(".error-message");
let imageEle = document.querySelector("#image-element");
let btnEle = document.querySelectorAll("button");


const operatorsObj = {
  "&&": {
    precedence: 2,
    exec: (a, b) => a && b,
  },
  "||": {
    precedence: 1,
    exec: (a, b) => a || b,
  },
  "!": {
    precedence: 3,
    exec: (a) => !a,
  },
  "⊕": {
    precedence: 4,
    exec: (a, b) => a != b,
  },
};


Array.from(btnEle).map((btn) => {
  btn.addEventListener("click", (e) => {
    inputEle.value = inputEle.value + " " + btn.innerText + " ";
    render(e);
  });
});

formEle.addEventListener("submit", (e) => {
  e.preventDefault();
});

//Calls the render function whenever input value is changed.
inputEle.addEventListener("keyup", render);
inputEle.addEventListener("change", render);


//Parses the input string and converts it into an array of string.
function inputParser(str) {
  let tokenArray = [];
  let buffer = "";

  for (token of str) {
    if (token === " ") {
      buffer = "";
      continue;
    }

    if (buffer !== "") {
      if (buffer === token) {
        buffer += token;
        tokenArray[tokenArray.length - 1] = buffer;
        continue;
      }

      if (isAlphabet(token)) {
        if (isAlphabet(buffer)) {
          buffer += token;
          tokenArray[tokenArray.length - 1] = buffer;
          continue;
        }
      }
    }
    buffer = token;
    tokenArray.push(buffer);
  }
  return tokenArray;
}

// "Changes signs of operators, for e.g. AND='&&', NOT='!' etc."
// Returns an array like this-> ["A", "AND", "B", "or" "C"] = ["A", "&&", "B", "||", "C"].
function changeSigns(tokenizedArr) {
  for (let i = 0; i < tokenizedArr.length; i++) {
    switch (true) {
      case tokenizedArr[i].toLowerCase() === "and" || tokenizedArr[i] === "∧":
        tokenizedArr[i] = "&&";
        break;
      case tokenizedArr[i].toLowerCase() === "or" || tokenizedArr[i] === "∨":
        tokenizedArr[i] = "||";
        break;
      case tokenizedArr[i].toLowerCase() === "not" || tokenizedArr[i] === "¬":
        tokenizedArr[i] = "!";
        break;
      case tokenizedArr[i].toLowerCase() === "xor" || tokenizedArr[i] === "⊕":
        tokenizedArr[i] = "⊕";
        break;
    }
  }
  return tokenizedArr;
}


//Converts the input expression into postfix notaion or RPN notation using Shunting yard alogorithm.
//Returns an array. ["A", "&&", "!", "B"] = ["A", "B","!", "&&"]
function infiToPostfi(tokenizeArr) {
  let operationQueue = []; //Stores the postfix expression
  let tokenStack = []; // Stores operators in a stack, later added into the OperationQueue

  //If the last element of expression in an unary operator(not) then throws an error.
  if (tokenizeArr.at(-1) === "!") {
    throw new Error("Binary Operator Needed.");
  }

  for (let token of tokenizeArr) {
    //If the token is an empty space simply skips it.
    //If the token is an alphabet of an opening paranthesis, pushes it into the operationQueue and tokenStack.
    if (token === " ") {
      continue;
    }

    if (isAlphabet(token)) {
      operationQueue.push(token);
      continue;
    }

    if (token == "(") {
      tokenStack.push(token);
      continue;
    }

    //When finding a closing parantheis, pushes every operator from tokenstack to operatorQueue until finding an opening paranthesis.
    //If it doesn't finds an ( then thrown an error.
    if (token === ")") {
      let o1 = peek(tokenStack);
      while (o1 !== "(") {
        if (tokenStack.length === 0) {
          throw new Error("Invalid Expression!");
        }
        operationQueue.push(tokenStack.pop());
        o1 = peek(tokenStack);
      }
      if (peek(tokenStack) !== "(") {
        throw new Error("Invalid Expression!");
      }
      tokenStack.pop();
      continue;
    }

    //When finds an operator pushes it into tokenStack if its precedence is greater than the last operator.
    //If not then remooves the last operator and push it into opQueue until finds an lower precedence operator.
    if (token in operatorsObj) {
      let o1 = token;
      let o2 = peek(tokenStack);

      while (
        o2 !== undefined &&
        operatorsObj[o2].precedence > operatorsObj[o1].precedence &&
        o2 !== "("
      ) {
        operationQueue.push(tokenStack.pop());
        o2 = peek(tokenStack);
      }
      tokenStack.push(o1);
      continue;
    }

    //When finding a number throws an error.
    if (!isNaN(parseFloat(token))) {
      throw new Error("Please enter a variable instead of Number.");
    }

    //At last throws an error, if not satisfying any of the above condition.
    throw new Error("Invalid Notation or Argument:" + ` "${token}"`);
  }

  //If there is still any operator left in tokenStack, pushes it into operationQueue.
  if (tokenStack.length !== 0) {
    while (tokenStack.length !== 0) {
      if (peek(tokenStack) === "(") {
        throw new Error("Invalid Expression!");
      }
      operationQueue.push(tokenStack.pop());
    }
  }

  return operationQueue;
}

// "Assigns the input variables to a column of the 2d truth table array for creating the table."
// "Returns an object and no of variables. for e.g. [{'a':0,'b':1,'c':2},3] "
function alphabetToValueMap(tokenArray) {
  let map = {};
  let i = 0;

  for (token of tokenArray) {
    if (isAlphabet(token)) {
      if (map[token] === undefined) {
        map[token] = i;
        i++;
      }
    }
  }
  return [map, i];
}

//Generates an initial 2d array with 0 and 1.
//noOfVariable=2 -> [[0,0],[0,1],[1,0],[1,1]]
function generateTable(noOfVariable) {
  let noOfCombination = 2 ** noOfVariable;
  let truthTableArr = [];
  traverse([]);

  function traverse(arr) {
    if (truthTableArr.length == noOfCombination) {
      return;
    }

    if (arr.length == noOfVariable) {
      truthTableArr.push(arr);
      return;
    }
    traverse([...arr, 0]);
    traverse([...arr, 1]);
  }
  return truthTableArr;
}


//Loops over the initial truth table, and evaluates the table row by row.
//Returns a 2d array where every row contains its output as its last element.
//["A","B","&&"] [[0,0],[0,1],[1,0],[1,1]], {"A":0,"B":1} -> [[0,0,0],[0,1,0],[1,0,0],[1,1,1]]
function calculateTable(operationQueue, table, ATSMap) {
  for (let i = 0; i < table.length; i++) {
    let res = calculateExpression(operationQueue, table[i], ATSMap);
    table[i].push(res);
  }
  return table;
}


//Calculates the expression for one row, takes operationQueue, A single row of truth table, and AlphabetToValue map.
//Returns an array with last element being the output of the expression.
//for e.g. opQueue=["A","B","&&"], row=[0,1], ATSMap={"A":0,"B":1} -> Output = [0,1,0]
function calculateExpression(operationQueue, row, ATSMap) {
  let stack = [];

  for (let i = 0; i < operationQueue.length; i++) {
    token = operationQueue[i];
    if (isAlphabet(token)) {
      stack.push(row[ATSMap[token]]);
    } else {
      if (stack.length === 0) {
        throw new Error("Please Enter an Expression!");
      }

      //If operator is binary, pops top two values from stack, performs given operation on them, if any value is undefined throws an error.
      if (token === "&&" || token === "||" || token === "⊕") {
        let o1 = stack.pop();
        let o2 = stack.pop();

        if (o1 !== undefined && o2 != undefined) {
          let res = operatorsObj[token].exec(o2, o1);
          stack.push(res ? 1 : 0);
          continue;
        }
        throw new Error("Not enough argument.");
      }

      //If operator is unary pops only one value from stack, throws error if undefined.
      if (token === "!") {
        let o1 = stack.pop();
        if (o1 !== undefined) {
          let res = operatorsObj[token].exec(o1);
          //Converts true or false to 1 or zero.
          stack.push(res ? 1 : 0);
          continue;
        }
        throw new Error("Not enough argument.");
      }
      throw new Error("Unknown Operator.");
    }
  }
  //On succesful evaluation there should be only one value left in the stack, if there are more than one it means there is an operator missing.
  if (stack.length > 1) {
    throw new Error("Looks like you forgot an Operator.");
  }
  return peek(stack);
}


//Creates html table elements with given values.
function generateTableWebView(calculatedTable, ATSMap) {
  //checks and deletes the previous truth tAable, if exists.
  tableEle.innerHTML = "";

  let tableHead = document.createElement("thead");
  let tableBody = document.createElement("tbody");
  let tableHeadRow = document.createElement("tr");

  //Sets table head with variables and expression.
  for (variable of Object.keys(ATSMap)) {
    let tdEle = document.createElement("th");
    tdEle.innerText = variable;
    tableHeadRow.appendChild(tdEle);
  }

  let variablecolele = document.createElement("th");
  variablecolele.innerText = str;
  tableHeadRow.appendChild(variablecolele);
  tableHead.appendChild(tableHeadRow);
  tableEle.appendChild(tableHead);

  //Populates the table with the evaluated 2d array.
  for (let i = 0; i < calculatedTable.length; i++) {
    let trEle = document.createElement("tr");
    for (let j = 0; j < calculatedTable[0].length; j++) {
      let tdEle = document.createElement("td");
      tdEle.innerText = calculatedTable[i][j];
      trEle.appendChild(tdEle);
    }
    tableBody.appendChild(trEle);
  }
  tableEle.appendChild(tableBody);
}


// calls all functions and generates the truth table and returns a 2d array size of
//  2**noOfVariables and each row last element represents expression output.
function generate(str) {
  let tokenArray = inputParser(str);
  let tokenArrayWithConsistentSign = changeSigns(tokenArray);

  try {
    var operationQueue = infiToPostfi(tokenArrayWithConsistentSign);
  } catch (error) {
    throw error;
  }

  var [ATSMap, noOfVariableInExpression] = alphabetToValueMap(tokenArray);
  ATSMapp = ATSMap;

  let truthTableArr = generateTable(noOfVariableInExpression);
  try {
    let res = calculateTable(operationQueue, truthTableArr, ATSMap);
    return [res, ATSMap];
  } catch (error) {
    throw error;
  }
}


//Manages events and calls generate function and catches error, and hide and show them.
function render(e) {
  e.preventDefault();
  hideError();
  tableEle.innerHTML = "";
  str = inputEle.value;
  let calculatedTable = [];
  let ATSMap = {};
  if (str) {
    try {
      [calculatedTable, ATSMap] = generate(str);
    } catch (error) {
      showError(error);
      return;
    }

    if (calculatedTable) {
      generateTableWebView(calculatedTable, ATSMap);
    }
  } else {
    tableEle.innerHTML = "";
  }
}


//Checks if given string is an alphabet or word or not.
function isAlphabet(string) {
  for (char of string) {
    let charCode = char.charCodeAt(0);
    if (
      !(
        (charCode >= 65 && charCode <= 90) ||
        (charCode >= 97 && charCode <= 122)
      )
    ) {
      return false;
    }
  }
  return true;
}

//Returns top value of stack.
function peek(stack) {
  return stack.at(-1);
}

//Shows error message.
function showError(errMessage) {
  errorElemnt.innerText = errMessage;
  imageEle.style.display = "block";
}

//Hides error message.
function hideError() {
  errorElemnt.innerText = "";
  imageEle.style.display = "none";
}
