export function Hero() {
  return (
    <section className="relative bg-secondary/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl  font-bold tracking-tight text-balance mb-6">
            Phong cách hiện đại cho cuộc sống năng động
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8">
            Khám phá bộ sưu tập thời trang basic chất lượng cao, thiết kế tối
            giản và tinh tế cho mọi dịp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#products"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Khám phá ngay
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              Bộ sưu tập mới
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
