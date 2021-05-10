/* 
Launch server typing "node path-to/server.js" in command line
Kill server typing "taskkill /f /im node.exe" in command line
Don't forget to type "npm install" in cmd to install project dependencies
Changes in server.js will be applicated only and only if we reload the server by killing current (cf l.3) and re-launching a new server (cf l.2)
*/

let model = require('./model/model')
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

// template engine
const cons = require('consolidate');
const { mustache } = require('consolidate');
app.engine('html', cons.mustache);
app.set('view engine', 'html');
app.set('views',__dirname+'/views');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  secret: 'mot-de-passe',
}))

//static files
app.use(express.static(__dirname+'/static'));

function is_logged_in(req){
	return req.session && req.session.user;
}
function exit_quizz(req){
	if(req.session && req.session.quizz){
		req.session.quizz = null
	}
}

function add_info(req, res, next){
	const info = {
		'wrong-password':{text:'Mauvais mdp'},
		'inexistant-user':{text:'Utilisateur inexistant'},
		'logout':{text:'Vous vous êtes déconnecté'},
		'logged-in':{text:'Bien connecté'},
		'not-connected':{text:"Vous n'êtes pas connecté"},
		'signup-error':{text:'Erreur durant la création du compte'},
		'session-error':{text:'Erreur de session'},
		'wrong-creation':{text:"Champs de création de l'utilisateur incorrects"},
		'well-modified':{text:"Les données d'utilisateur ont bien été modifiées !"},
		'user-deleted':{text:"L'utilisateur a bien été supprimé, aucune donnée n'a été conservée."},
		'unique-constraint':{text:"Ce nom d'utilisateur est déjà pris, utilisez-en un autre."},
		'RGPD':{text:"Notre site utilise des cookies pour son bon fonctionnement. Toute information personnelle rentrée sur le site ne sera en aucun cas utilisée à d'autres fin que ce site, vous pouvez supprimer toutes vos données à tout moment dans l'onglet /user."},
	}
	if(req.query.info && req.query.info in info){
		res.locals.info = info[req.query.info];
	}
	return next();
}
app.use(add_info);

function add_action(req,res, next){
	const action = {
		'register':{class:'displaying'},
	}
	if(req.query.action && req.query.action in action){
		res.locals.action = action[req.query.action];
	}
	return next();
}
app.use(add_action)
/* POSTS */

app.post('/login', (req, res) => {
    if(!('password' in req.body && 'user' in req.body)) {
      res.status(400).send('invalid request');
      return;
    }
    let user = model.login(req.body.user, req.body.password);
    if(user >= 0 ) { //Logged-in
    	req.session.user = user;
		res.redirect('/?info=logged-in')
    } else {
        if(user == -1){ // Mauvais mdp
			res.redirect('/?info=wrong-password')
        }
        else if (user==-2){//Inexistant
			res.redirect('/?action=register')
        }
    }
});
app.post('/new-user',(req,res)=>{
	if(!('password' in req.body && 'user' in req.body && 'confirm' in req.body && req.body.password == req.body.confirm) || req.body.password ==''||req.body.confirm==''||req.body.user=='') {
		res.redirect('/?info=wrong-creation')
	}
	let user = model.addEmptyUser(req.body.user, req.body.password, 'client');
	if(user<0){
		res.redirect('/?info=unique-constraint')
	}
	else{
		user = model.login(req.body.user,req.body.password);
		req.session.user = user;
		res.redirect('/?info=logged-in')
	}
})
app.post('/modify-user',(req,res)=>{
	
	if(!is_logged_in(req)) res.redirect("/?info=session-error");
	else{
		try{																										// Pour avoir un booléen
			model.modify_user(req.session.user, req.body.user_name, req.body.user_pass, null, req.body.user_birth, req.body.reset_scores&&true);
			res.redirect('/user')
		}catch(e){
			res.redirect('/?info=unique-constraint');
		}
	}
})
app.post('/logout',(req,res)=>{
	if(is_logged_in(req)){
		req.session.user = null;
	}
	res.redirect("/?info=logout")
})
app.post('/delete-user',(req,res)=>{
	if(!is_logged_in(req)) res.redirect("/?info=session-error");
	else{
		model.delete_user(req.session.user);
		req.session=null;
		res.redirect("/?info=user-deleted");
	}
})
app.post('/send-score',(req,res)=>{
	if(is_logged_in(req)){
		if(req.body.score > model.get_scores(req.session.user).rainingRubbish) model.modify_scores(req.session.user,req.body.score,null);
	}
})
app.post('/answer',(req,res)=>{
	let status = {status:"not-logged",}
	if(is_logged_in(req)){
		status = {status:"logged",user:model.get_user(req.session.user),};
	}
	if(!req.session.quizz) res.redirect('/quizz');
	else{
		
		var currentQ =  model.get_question(req.session.quizz.questions_indexes[req.session.quizz.question_number-1])
		if(req.session.quizz.answered < req.session.quizz.question_number){
			req.session.quizz.answered++;
			if(currentQ.correct == parseInt(req.body.choice)-1){
				req.session.quizz.score++;
			}
		}
		
		let styleClass={
			nextBtn:"not-hide",
			startBtn:"hide",
			endBtn:"hide",
			questionsContainer:"not-hide",
			score:"not-hide",
			formResult:"hide",
			answer1:"wrong",
			answer2:"wrong",
			answer3:"wrong",
			answer4:"wrong",
		}
		if(currentQ.correct==0) styleClass.answer1 = "correct";
		if(currentQ.correct==1) styleClass.answer2 = "correct";
		if(currentQ.correct==2) styleClass.answer3 = "correct";
		if(currentQ.correct==3) styleClass.answer4 = "correct";
		if(req.session.quizz.question_number==req.session.quizz.questions_indexes.length){
			styleClass.endBtn = "not-hide"
			styleClass.nextBtn = "hide"
		}

		let data = {
			status:status,
			disabled:"disabled",
			question:currentQ,
			style:styleClass,
			index : req.session.quizz.question_number,
			maxIndex : model.get_quizz_questions_size(),
			finished : false,
			score : req.session.quizz.score,
		}
		res.render('quizz',data)
	}
})
app.post('/quizz/next',(req,res)=>{
	if(req.session.quizz){
		req.session.quizz.question_number++;
	}
	res.redirect('/quizz');
})
app.post('/quizz/start',(req,res)=>{
	if(req.session.quizz){
		req.session.quizz.start = false
		req.session.quizz.question_number=1;
	}
	res.redirect("/quizz")
})
app.post('/quizz-end',(req,res)=>{
	let status = {status:"not-logged",}
	if(is_logged_in(req)){
		status = {status:"logged",user:model.get_user(req.session.user),}
		if(req.session.quizz.score > model.get_scores(req.session.user).quizz) model.modify_scores(req.session.user,null,req.session.quizz.score);
	}
	let previndex = req.session.quizz.question_number;
	let prevmaxindex = req.session.quizz.questions_indexes.length;
	let prevScore =req.session.quizz.score;
	let styleClass={
		nextBtn:"hide",
		questionsContainer:"hide",
		score:"hide",
		startBtn:"not-hide",
		formResult:"not-hide",
		endBtn:"hide",
	}	
	let data = {
		style:styleClass,
		index : previndex,
		maxIndex : prevmaxindex,
		score : prevScore,
		percent : Math.floor((prevScore/prevmaxindex)*100),
		status:status,
	}
	req.session.quizz = {
		questions_indexes : model.get_random_questions_indexes(model.get_quizz_questions_size()),
		question_number : 0,
		score : 0,
		start:true,
	}
	res.render('quizz',data)
})
/* GETS */
app.get('/quizz',(req,res)=>{
	let status = {status:"not-logged",}
	if(is_logged_in(req)){
		status = {status:"logged",user:model.get_user(req.session.user),};
	}
	var currentQuestion = null;
	/* In game display */
	let styleClass={
			nextBtn:"not-hide",
			questionsContainer:"not-hide",
			score:"not-hide",
			startBtn:"hide",
			formResult:"hide",
			endBtn:"hide",
	}
	/* Init quizz */
	if(!req.session.quizz || req.session.quizz.start){
		req.session.quizz = {
			questions_indexes : model.get_random_questions_indexes(model.get_quizz_questions_size()),
			question_number : 0,
			score : 0,
			start:true,
			answered:0,
		}
		styleClass={
			nextBtn:"hide",
			startBtn:"not-hide",
			questionsContainer:"hide",
			score:"hide",
			formResult:"hide",
			endBtn:"hide",
		}

	}
	/* End Game */
	if(req.session.quizz.question_number==req.session.quizz.questions_indexes.length){
		styleClass.endBtn = "not-hide"
		styleClass.nextBtn = "hide"
	}
	if(req.session.quizz.question_number>0) {
		currentQuestion = model.get_question(req.session.quizz.questions_indexes[req.session.quizz.question_number-1]);
		req.session.quizz.correctAnswer = currentQuestion.correct;
	}
	data = {
		status:status,
		style:styleClass,
		index : req.session.quizz.question_number,
		maxIndex : model.get_quizz_questions_size(),
		score : req.session.quizz.score,
	}
	if(currentQuestion){
		data.question = currentQuestion;
	}
	res.render('quizz',data)
})
app.get('/', (req, res) => {
	exit_quizz(req)
	if(is_logged_in(req)){
		res.render('index',{status:"logged",user:model.get_user(req.session.user)});
	}
	else{
		res.render('index',{status:"not-logged"})
	}
    
});
app.get('/games',(req,res)=>{
	exit_quizz(req)
	var dashboard = model.get_scores_board();
	var status ="not-logged"
	if(is_logged_in(req)){
		status = "logged"
	}
	res.render('games',{status:status,user:model.get_user(req.session.user),global_scores:dashboard.global,RR_scores:dashboard.RR,quizz_scores:dashboard.quizz});

})
app.get('/game',(req,res)=>{
	exit_quizz(req)
	if(is_logged_in(req)){
		res.render('game',{status:"logged",user:model.get_user(req.session.user)});
	}
	else{
		res.render('game',{status:"not-logged"});
	}
})
app.get('/user',(req,res)=>{
	exit_quizz(req)
	if(is_logged_in(req)){
		data = model.get_user(req.session.user);
		scores = model.get_scores(req.session.user);
		if(data && data != -1)res.render('user',{user:data,scores:scores});
		else res.redirect("/?info=session-error");
	}
	else res.redirect("/?info=not-connected")
})
/* START */
app.listen(port, () => {
    console.log('Server app listening on port ' + port);
});

module.exports = app;