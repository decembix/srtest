// 가로 너비 800px 넘으면, 스크롤 기능 구현
if (window.innerWidth > 800) {
	const scrollContainer = document.querySelector(".tabs");

	scrollContainer.addEventListener("wheel", (evt) => {
		evt.preventDefault();
		scrollContainer.scrollLeft += evt.deltaY;
	});
}