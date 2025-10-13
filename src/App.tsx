import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Resume from "./pages/Resume";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Portfolio from "./pages/Portfolio";
import NotFound from "./pages/NotFound";

function App(){
    return(
        <div className={"min-h-screen flex flex-col"}>
            <Header />
            <NavBar />
            <main className={"flex-1"}>
                <div className={"mx-auto max-w-screen-xl px-4 py-8"}>
                    <Routes>
                        <Route path={"/"} element={<Home />} />
                        <Route path={"/about"} element={<About />} />
                        <Route path={"/contact"} element={<Contact />} />

                        <Route path={"/resume"} element={<Resume />} />

                        <Route path={"/blog"} element={<Blog />} />
                        <Route path={"/blog/:slug"} element={<BlogPost />} />

                        <Route path={"/portfolio"} element={<Portfolio />} />

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default App