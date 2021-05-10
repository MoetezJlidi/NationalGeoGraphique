const PROD_KG_DAY = 0.74 //kgs of rubbish per day
const PROD_KG_SEC = (PROD_KG_DAY/24)/3600 //kgs of rubbish per day

let currentTime = Date.now();
let count = Math.floor(((currentTime - getDate())*PROD_KG_SEC)/10)/100;
let result = "Vous n'avez pas rentré de date de naissance, le compteur ne peut marcher.";
if(getDate() !=null){
    
    strcount = count.toString().split(".")
    console.log(strcount)
    count = separateNumbers(parseInt(strcount[0]));
    strcount = count+"."+strcount[1]
    console.log(strcount)
    result = "Vous avez produit "+intoBalises("span"," id='value '",strcount)+" kilogrammes de dechets depuis votre naissance";
}
document.getElementById("counter").innerHTML = result;


function getDate(){
    var dateVal = document.getElementById("user-dob");
    if(dateVal.innerText == "") return null
    var slashC = 0
    var day = [];
    var month = [];
    var year =[];
    for (var letter of dateVal.innerText){
        if(letter == '/'){
            slashC++;
        }
        else{
            if(slashC == 0) day.push(letter);
            else if (slashC == 1) month.push(letter);
            else if (slashC == 2) year.push(letter);
            else throw new Error("Mauvaise date de naissance : (Trop de '/')")
        }
    }

    console.log(day+"-"+month+"-"+year)
    year = parseInt(year.join(""));
    month = parseInt(month.join(""))-1;
    day = parseInt(day.join(""));
    return new Date(year,month,day,0,0,0,1).getTime();
}
function separateNumbers(integer){
    let strCopy = ""+integer;
    let reversedResult = ""
    var j = strCopy.length -1
    for(var i = 0; i<strCopy.length; i++){
        reversedResult += strCopy.charAt(j);
        if((i+1)%3 == 0){
            reversedResult += " ";
        }
        j--
    }
    return reverseString(reversedResult);
}
function intoBalises(balise, args, content){
    return "<"+balise+" "+args+">"+content+"<"+balise+">";
}
function reverseString(string){
    let result = ""
    for(var i=string.length-1;i>=0;i--){
        result+=string.charAt(i);
    }
    return result;
}

