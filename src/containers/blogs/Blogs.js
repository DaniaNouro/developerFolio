import React, { useState, useEffect, useContext } from "react";
import "./Blog.scss";
import BlogCard from "../../components/blogCard/BlogCard";
import { blogSection } from "../../portfolio";
import { Fade } from "react-reveal";
import StyleContext from "../../contexts/StyleContext";

export default function Blogs() {
  const { isDark } = useContext(StyleContext);
  const [mediumBlogs, setMediumBlogs] = useState([]);

  function setMediumBlogsFunction(array) {
    setMediumBlogs(array);
  }

  // Extract text from HTML content
  function extractTextContent(html) {
    return typeof html === "string"
      ? html
          .split(/<\/p>/i)
          .map((part) => part.split(/<p[^>]*>/i).pop())
          .filter((el) => el.trim().length > 0)
          .map((el) => el.replace(/<\/?[^>]+(>|$)/g, "").trim())
          .join(" ")
      : "";
  }

  useEffect(() => {
    if (blogSection.displayMediumBlogs === "true") {
      const getProfileData = async () => {
        try {
          const result = await fetch("/blogs.json");
          if (!result.ok) throw new Error("Fetch failed");
          const response = await result.json();
          // Protect against undefined items
          if (response && Array.isArray(response.items)) {
            setMediumBlogsFunction(response.items);
          } else {
            throw new Error("Invalid Medium response format");
          }
        } catch (error) {
          console.error(
            `${error} (because of this error Blogs section could not be displayed. Blogs section has reverted to default)`
          );
          setMediumBlogsFunction("Error");
          blogSection.displayMediumBlogs = "false";
        }
      };
      getProfileData();
    }
  }, []);

  if (!blogSection.display) return null;

  return (
    <Fade bottom duration={1000} distance="20px">
      <div className="main" id="blogs">
        <div className="blog-header">
          <h1 className="blog-header-text">{blogSection.title}</h1>
          <p className={isDark ? "dark-mode blog-subtitle" : "subTitle blog-subtitle"}>
            {blogSection.subtitle}
          </p>
        </div>
        <div className="blog-main-div">
          <div className="blog-text-div">
            {blogSection.displayMediumBlogs !== "true" || mediumBlogs === "Error"
              ? blogSection.blogs.map((blog, i) => (
                  <BlogCard
                    key={i}
                    isDark={isDark}
                    blog={{
                      url: blog.url,
                      image: blog.image,
                      title: blog.title,
                      description: blog.description,
                    }}
                  />
                ))
              : mediumBlogs.map((blog, i) => (
                  <BlogCard
                    key={i}
                    isDark={isDark}
                    blog={{
                      url: blog.link,
                      title: blog.title,
                      description: extractTextContent(blog.content),
                    }}
                  />
                ))}
          </div>
        </div>
      </div>
    </Fade>
  );
}
