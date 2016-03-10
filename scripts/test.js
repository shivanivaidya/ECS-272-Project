t = "((2,(5,(7,(10,11)8,9)6)3,4)1)";
t_names = "((two,(five,(seven,(ten,eleven)eight,nine)six)three,four)one)";
names = "(((((Vihaan)Vaibhav)Rajan,((Monu)Sonu)Shailen,Kumar)Madhukar,((Shashank)Sanjay,(Amey)Girish,(Piyush)Laxmikant,(Rahul)Hemant)Vinayak)Dattatraya)"

function path(ele, tree){
  var p = [];
  p.push(ele);

  current = tree.indexOf(ele);
  tree = tree.substring(current);

  while(true){
    o_bracket = tree.indexOf("\(");
    c_bracket = tree.indexOf("\)");
    closest = findClosestBracket(o_bracket, c_bracket);

    while(closest == "ob"){
      closest_cb = tree.indexOf("\)");
      temp_tree = tree.substring(0, closest_cb);

      n = temp_tree.split('\(').length-1;

      for(i =0; i<n; i++){
        tree = tree.substring(tree.indexOf("\)") + 1);

        o_bracket = tree.indexOf("\(");
        c_bracket = tree.indexOf("\)");
        c = findClosestBracket(o_bracket, c_bracket);

        if(c == "ob")
          n++;
      }

      o_bracket = tree.indexOf("\(");
      c_bracket = tree.indexOf("\)");
      closest = findClosestBracket(o_bracket, c_bracket);
    }

    c_bracket = tree.indexOf("\)");
    tree = tree.substring(c_bracket+1);

    comma = tree.indexOf(",");
    next_c_bracket = tree.indexOf("\)");

    if(next_c_bracket == -1){
      break;
    }
    else{
      if(comma != -1 && comma > next_c_bracket){
        parent = tree.substring(0,next_c_bracket);
        p.push(parent);
      }
      else if(comma != -1 && comma < next_c_bracket){
        parent = tree.substring(0,comma);
        p.push(parent);
      }
      else{
        parent = tree.substring(0,next_c_bracket);
        p.push(parent);
      }
    }
  }
  console.log(p);
}

function findClosestBracket(ob, cb){
  if(ob == -1)
    return "cb";
  else if(cb == -1)
    return "ob";
  else if(ob != -1 && cb != -1 && ob < cb)
    return "ob";
  else
    return "cb";
}

path("one", t_names);
