const Sqlite = require('better-sqlite3');
const cons = require('consolidate');
const e = require('express');

let db = new Sqlite('model/db.sqlite');

// Création des tables
function init_tables(){       
                             
    db.prepare('CREATE TABLE IF NOT EXISTS users (name TEXT PRIMARY KEY, password TEXT, role TEXT, date_of_birth TEXT)').run();
    db.prepare('CREATE TABLE IF NOT EXISTS scores (global INT, rainingRubbish INT, quizz INT)').run();
    db.prepare('CREATE TABLE IF NOT EXISTS quizz_questions (question TEXT PRIMARY KEY, possible_answer1 TEXT, possible_answer2 TEXT, possible_answer3 TEXT, possible_answer4 TEXT, correct_answer INT)').run();
}

function get_quizz_questions_size(){
    return db.prepare("SELECT COUNT(*) as count FROM quizz_questions").get().count;
}

// quizz table


function add_question(question, possible_answers,correct_answer){
    
    if(!(question && possible_answers && correct_answer!=null) || possible_answers.length != 4 || correct_answer > 3 || correct_answer < 0){
        throw new Error("Invalid quizz question");
    }
    try{
        var insert = db.prepare("INSERT INTO quizz_questions VALUES (?,?,?,?,?,?)");
        var result = insert.run([question,possible_answers[0],possible_answers[1],possible_answers[2],possible_answers[3],correct_answer]);
        return result.lastInsertRowid; 
    } catch(e){ throw e }
}
function get_random_questions_indexes(n){
    let array = []
    for(var i = 0; i<n;i++){
        array.push(i+1)
    }
    return array.sort(() => Math.random() - 0.5) ;
}

function get_question(rowid){
    if(!rowid) return null;
    try{
        let select = db.prepare("SELECT question, possible_answer1 as answer1, possible_answer2 as answer2, possible_answer3 as answer3, possible_answer4 as answer4, correct_answer as correct FROM quizz_questions WHERE rowid = ?")
        let result = select.get(rowid);
        return result;
    }catch(e){throw e;}
}

function get_questions(){
    try{
        let select = db.prepare("SELECT question, possible_answer1, possible_answer2, possible_answer3, possible_answer4, correct_answer FROM quizz_questions")
        let result = select.all();
        return result;
    }catch(e){throw e;}
}

// scores table

function init_scores(){
    try{
        var insert = db.prepare("INSERT INTO scores VALUES (0,0,0)");
        var result = insert.run();
        return result.lastInsertRowid; 
    } catch(e){ throw e }
}

function delete_scores(rowid){
    try{
        var del = db.prepare("DELETE FROM scores WHERE rowid=?");
        var result = del.run(rowid);
    } catch(e){ throw e }
}

function reset_scores(rowid){
    modify_scores(rowid,0,0)
}

function modify_scores(rowid, newScoreRR, newScoreQuizz){
    modify_score_rainingRubbish(rowid, newScoreRR);
    modify_score_quizz(rowid,newScoreQuizz);
    calculate_global_score(rowid);
}

function calculate_global_score(rowid){
    if(rowid){
        try{
            var select = db.prepare("SELECT rainingRubbish, quizz FROM scores WHERE rowid=?");
            var scores = select.get(rowid);
            var global = 0;
            for(prop in scores){
                global += scores[prop];
            }
            var insert = db.prepare("UPDATE scores SET global = ? WHERE rowid = ?");
            var result = insert.run([global,rowid]);
            return 0
        }catch(e){throw e}
        
    }
}
function modify_score_rainingRubbish(rowid, newScore){
    if(newScore != null && rowid){
        try{
            var query = db.prepare("UPDATE scores SET rainingRubbish = ? WHERE rowid = ?")
            var result = query.run([newScore,rowid]);
            return 0;
        }catch(e){ throw e; }
    }
    else return 1;
}

function modify_score_quizz(rowid, newScore){
    if(newScore != null && rowid){
        try{
            var query = db.prepare("UPDATE scores SET quizz = ? WHERE rowid = ?")
            var result = query.run([newScore,rowid]);
            return 0;
        }catch(e){ throw e; }
    }
    else return 1;
}

function get_scores(rowid){
    if(rowid){
        try{
            var select = db.prepare("SELECT global,rainingRubbish, quizz FROM scores WHERE rowid = ?");
            var result = select.get([rowid]);
            if(result){
                result.global = 0
                for(var prop in result){
                    result.global += result[prop];
                }   
                return result;
            }
            else return null
        }catch(e){ throw e; }
    }
    
}

function get_scores_board(){
    var scoresBoard = {global: get_global_scores(),RR:get_RR_scores(),quizz:get_quizz_scores()}
    return scoresBoard;
}
    
function get_global_scores(){
    let select = db.prepare("SELECT u.name, s.global FROM users u INNER JOIN scores s ON u.rowid = s.rowid ORDER BY s.global DESC LIMIT 10")
    let result = select.all();
    return result;
}
function get_RR_scores(){
    let select = db.prepare("SELECT u.name, s.rainingRubbish FROM users u INNER JOIN scores s ON u.rowid = s.rowid ORDER BY s.rainingRubbish DESC LIMIT 10")
    let result = select.all();
    return result;

}
function get_quizz_scores(){
    let select = db.prepare("SELECT u.name, s.quizz FROM users u INNER JOIN scores s ON u.rowid = s.rowid ORDER BY s.quizz DESC LIMIT 10")
    let result = select.all();
    return result;
}


// users Table

function print_table_content(){
    var i = 1;
    do{
        var user = get_user(i);
        i++;
    }while(user != null);
}

function add_user(name, password, role, date_of_birth){
    if(!name || !password || !role) {
        return -1;
    }
    if(!date_of_birth) date_of_birth = "";
    try{
        var insert = db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)');
        var result = insert.run([name,password,role,date_of_birth]);
        init_scores();
        return result.lastInsertRowid;
    } catch(e){
        if(e.code == 'SQLITE_CONSTRAINT_PRIMARYKEY') return -2; //User already exists
        throw e;
    }
}

function delete_user(rowid){
    try{
        var query = db.prepare('DELETE FROM users WHERE rowid=?');
        var result = query.run(rowid);
        delete_scores(rowid);
    }catch(e) {throw e;}
}

function modify_user(rowid,name,pwd,role,dob,resetScores){
    try{
        if(name) modify_user_name(rowid,name);
    }catch(e){
        throw e;
    }
    if(pwd) modify_user_pwd(rowid,pwd);
    if(role) modify_user_role(rowid,role);
    if(dob) modify_user_dob(rowid,dob);
    if(resetScores) reset_scores(rowid);
}

function modify_user_name(rowid,name){
    try{
        var query = db.prepare('UPDATE users SET name = ? where (rowid=?)');
        var result = query.run([name,rowid]);
    }
    catch(e){
        throw e;
    }
}
function modify_user_pwd(rowid,pwd){
    try{
        var query = db.prepare('UPDATE users SET password = ? where (rowid=?)');
        var result = query.run([pwd,rowid]);
    }catch(e){
        throw e;
    }
}
function modify_user_dob(rowid,dob){
    try{
        var query = db.prepare('UPDATE users SET date_of_birth = ? where (rowid=?)');
        var result = query.run([dob,rowid]);
    }catch(e){
        throw e;
    }
}
function modify_user_role(rowid,role){
    try{
        var query = db.prepare('UPDATE users SET role = ? where (rowid=?)');
        var result = query.run([role,rowid]);
    }catch(e){throw e;}
}

function get_user(rowid){
    if(rowid!=null){
        let selection = db.prepare('SELECT name, password, role, date_of_birth FROM users WHERE rowid = ?')
        let result = selection.get([rowid]);
        if(result){
            let selectScore = db.prepare('SELECT global FROM scores WHERE rowid = ?')
            let score = selectScore.get([rowid]).global;
            result.score = score;
            return result;
        }
        else return null;
    }
    else return -1;// Wrong argument
}
function get_user_name(rowid){
    if(rowid!=null){
        let selection = db.prepare('SELECT name FROM users WHERE rowid = ?')
        let result = selection.get([rowid]);
        if(result) return result;
        else return null;
    }
}

function addEmptyUser(name,password,role){
    return add_user(name,password,role,0,null);
}

function login(name, password) {
    let select = db.prepare('SELECT rowid FROM users WHERE name = ? AND password = ?');
    let result = select.get([name, password]);
    if(result) return result.rowid;
    else{
        select = db.prepare('SELECT rowid FROM users WHERE name = ?');
        result = select.get([name]);
        if(result){
            return -1; //Mauvais mot de passe
        }
        else return -2; //Inexistant
    }
}

init_tables();

module.exports = {
    get_quizz_questions_size: get_quizz_questions_size,
    add_user : add_user,
    addEmptyUser : addEmptyUser,
    init_tables : init_tables,
    login : login,
    get_user : get_user,
    modify_user : modify_user,
    delete_user : delete_user,
    get_scores : get_scores,
    modify_scores : modify_scores,
    reset_scores : reset_scores,
    get_scores_board : get_scores_board,
    get_question:get_question,
    get_random_questions_indexes:get_random_questions_indexes,
    /*
    get_formatted_question:get_formatted_question,
    get_random_formated_questions:get_random_formated_questions,
    get_random_formated_question:get_random_formated_question;,
    */
}