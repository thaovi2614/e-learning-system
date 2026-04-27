import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./categoryMenu.css";

export default function CategoryMenu() {
    const [categories, setCategories] = useState([]);
    const fetchedRef = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        api.get("/categories").then(res => {
            setCategories(res.data);
        });
    }, []);

    const getChildren = (parent_id) => {
        return categories.filter(c => c.parent_id === parent_id);
    };

    const buildPath = (item) => {
        let path = item.slug;
        let parent = categories.find(c => c.id === item.parent_id);

        while (parent) {
            path = `${parent.slug}/${path}`;
            parent = categories.find(c => c.id === parent.parent_id);
        }

        return path;
    };

    const handleClick = (item) => {
        const path = buildPath(item);
        navigate(`/${path}`);
    };

    const renderMenu = (parent_id = null) => {
        const items = getChildren(parent_id);
        if (!items.length) return null;

        return (
            <ul className="cat-menu">
                {items.map(item => (
                    <li key={item.id} className="cat-menu-item">
                        <span
                            className="cat-menu-label"
                            onClick={() => handleClick(item)}
                        >
                            {item.name}
                        </span>

                        {renderMenu(item.id)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="category-menu">
            <span className="menu-title">Danh mục</span>
            <div className="cat-dropdown">
                {renderMenu(null)}
            </div>
        </div>
    );
}