var express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	expressSanitizer = require('express-sanitizer'),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	mongoose = require('mongoose'),
	flash    = require('connect-flash'),
	session  = require('express-session'),
	cookieParser = require('cookie-parser'),
	User = require('./public/schema/userschema'),
	Medicine = require('./public/schema/medschema');

//APP CONFIG
mongoose.connect("mongodb://localhost/medical");
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(cookieParser('secret'));



// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Dinesh is the best!!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next(); 
});


//RESTFUL ROUTES
app.get("/",function(req,res){
	res.render("landing");
});
app.get("/register",function(req,res){
	res.render("register");
});
app.get("/admin",function(req,res){
	res.render("admin");
});
app.get("/adminlanding",function(req,res){
	res.render("adminlanding");
});
app.get("/medicines/new",function(req,res){
	res.render("newmed");
});
app.get("/medicines",function(req,res){
	Medicine.find({}, function(err, allMedicines){
         if(err){
             console.log(err);
         } else {
              res.render("medlist.ejs",{medicines: allMedicines});
            }
      });

});
app.get("/userslist",function(req,res){
	User.find({}, function(err, allusers){
         if(err){
             console.log(err);
         } else {
              res.render("userslist.ejs",{user: allusers});
            }
      });

});

//PUT request
app.post("/admin",function(req,res){

	if(req.body.username=="dinesh" && req.body.password=="123")
	{
		res.render("adminlanding.ejs");
	}
	else
	{
		res.render("admin.ejs");
	}
});

// logout route
app.get("/logout", function(req, res){
   req.logout();
   // req.flash("success", "See you later!");
   res.redirect("/");
});

app.post("/register",function(req,res){ 
	
	    var newUser = new User({
			username:req.body.username,
			password:req.body.password,
			name:req.body.name,
			age:req.body.age,
			gender:req.body.gender,
			address:req.body.address,
			phone:req.body.phone
		});
		if(req.body.adminCode === process.env.ADMIN_CODE) {
			console.log("ADMIN");
		  newUser.isAdmin = true;
		}
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/"); 
        });
    });
});

app.post("/login",passport.authenticate("local",
	
	{
		successRedirect: "/purchase",
		failureRedirect: "/",
		failureFlash: true,
		successFlash: "Login Success!"
		
	}),function(req,res){
	
});

app.get("/purchase",function(req,res){
	  Medicine.find({}, function(err, allmedicines){
         if(err){
             console.log(err);
         } else {
              res.render("purchase",{medicines: allmedicines});
            }
      });

});

app.post("/purchase/:id",function(req,res){
	
	User.findById(req.user._id,function(err,user){
		
		if(err){
			console.log(err);
			res.redirect("/purchase");
		}else{
		
			Medicine.findById(req.params.id,function(err,foundMedicine){
				if(err){
					res.render("purchase");
				}else {
					console.log("posted!!");
					console.log(user);
					user.medicines.push(foundMedicine);
					user.save();
					res.redirect("/cart");
				}
			});
		}
	});
});

app.get("/cart",function(req,res){
	
		User.findById(req.user._id).populate("medicines").exec(function(err,user){
		if(err){
			console.log(err);
			res.redirect("/purchase");
		}else{
			res.render("cart",{user : user});
		}
	});
});

app.delete("/cart/:id",function(req,res){
		User.findById(req.user._id,function(err,user){
		
		if(err){
			console.log(err);
			res.redirect("/cart");
		}else{
		
			Medicine.findById(req.params.id,function(err,foundMedicine){
				if(err){
					res.render("purchase");
				}else {
					console.log("posted!!");
					console.log(user);
					user.medicines.pull(foundMedicine);
					user.save();
					res.redirect("/cart");
				}
			});
		}
	});
	
});
//CREATE ROUTE Medicine
app.post("/medicines",function(req,res){ 
	//create medicine
	req.body.Medicine.body = req.sanitize(req.body.Medicine.body);
	Medicine.create(req.body.Medicine,function(err,newMedicine){
		 if(err){
			 res.render("newmed");
		 }
		else{
			//then, redirect to index
			res.redirect("/medicines");
		}
	});
});

//EDIT ROUTE
app.get("/medicines/:id/edit",function(req,res){
	
	
	Medicine.findById(req.params.id,function(err,foundMedicine){
		if(err){
			res.redirect("/medicines");
		}else {
			res.render("editmes",{Medicine:foundMedicine});
		}
		
	})
	
});

//UPDATE ROUTE Medicine
app.put("/medicines/:id",function(req,res){
	req.body.Medicine.body = req.sanitize(req.body.Medicine.body);
	Medicine.findByIdAndUpdate(req.params.id,req.body.Medicine,function(err,updatedMedicine){
		if(err){
			res.redirect("/medicines");
		}else{
			res.redirect("/medicines");
		}
	})
});
//Delete Route User
app.delete("/userslist/:id",function(req,res){

	User.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/userslist");
		}else {
			//redirect somewhere
			res.redirect("/userslist");
		}
	})
	
});
//Delete route Medicine
app.delete("/medicines/:id",function(req,res){
	//destroy 
	Medicine.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/medicines");
		}else {
			//redirect somewhere
			res.redirect("/medicines");
		}
	})
	
});

app.listen(3000 || process.env.PORT,process.env.IP,function(){
	console.log("SERVER IS STARTED!!!");
})