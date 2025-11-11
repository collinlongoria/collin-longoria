import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Resume from "./pages/Resume";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Portfolio from "./pages/Portfolio";
import PortfolioSmart from "./pages/PortfolioRouter";
import PortfolioCategory from "./pages/PortfolioCategory";
import PortfolioItem from "./pages/PortfolioItem";
import NotFound from "./pages/NotFound";

function App(){
    return(
        <div className={"min-h-screen flex flex-col"}>
            <Header />
            <NavBar />
            <main className={"flex-1 bg-background"}>
                <div className={"mx-auto max-w-screen-xl px-4 py-8"}>
                    <Routes>
                        <Route path={"/"} element={<Home />} />
                        <Route path={"/contact"} element={<Contact />} />

                        <Route path={"/resume"} element={<Resume />} />

                        <Route path={"/blog"} element={<Blog />} />
                        <Route path={"/blog/:slug"} element={<BlogPost />} />

                        <Route path={"/portfolio"} element={<Portfolio />} />
                        <Route path="/portfolio/:key" element={<PortfolioSmart />} />
                        <Route path={"/portfolio/:categoryKey/:slug"} element={<PortfolioItem />} />

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default App