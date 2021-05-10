const MONDIALTONSWASTESEC = 63.91178266178
var startOf2021 = new Date("January 1, 21 00:00")
var currentTime = Date.now();

var values = {
    count : Math.floor(((currentTime - startOf2021)/1000)*MONDIALTONSWASTESEC),
    text : ""+startOf2021.getFullYear()
};

// TODO Rajouter "depuis {{date}}" ?

function intoBalises(balise, args, content){
    return "<"+balise+" "+args+">"+content+"<"+balise+">";
}

document.getElementById("currentCount").innerHTML = separateNumbers(values.count);
document.getElementById('counter').innerHTML += values.text;

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

function reverseString(string){
    let result = ""
    for(var i=string.length-1;i>=0;i--){
        result+=string.charAt(i);
    }
    return result;
}

var intervalms = 1000

setInterval(()=>{
    values.count+=Math.floor((MONDIALTONSWASTESEC/1000)*intervalms);
    document.getElementById("currentCount").innerHTML = separateNumbers(values.count);
},intervalms)
