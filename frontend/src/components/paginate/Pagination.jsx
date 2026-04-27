import "./pagination.css";

export default function Pagination({ page, totalPages, onPageChange }) {
    return (
        <div className="pagination">
            <button
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
            >
                «
            </button>

            {[...Array(totalPages)].map((_, i) => (
                <button
                    key={i}
                    className={page === i + 1 ? "active" : ""}
                    onClick={() => onPageChange(i + 1)}
                >
                    {i + 1}
                </button>
            ))}

            <button
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                »
            </button>
        </div>
    );
}