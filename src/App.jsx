import axios from "axios";
import {useEffect} from "react";
import AuthorizationCard from "./components/AuthorizationCard.jsx";

function App() {

    const hello_world = () => {
        axios.get('http://127.0.0.1:8000/helloworld').then((response) => {
            console.log(response)
        })
    }

    useEffect(() => {
        hello_world()
    }, []);

  return (
      <AuthorizationCard />
  )
}

export default App
