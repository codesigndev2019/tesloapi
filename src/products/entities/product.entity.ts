import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./product-image.entity";

@Entity()
export class Product {

    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column('text', {
        unique: true
    })
    title: string

    @Column('numeric', {
        default: 0
    })
    price: number

    @Column({
        type: 'text',
        nullable: true
    })
    description: string

    @Column({
        type: 'text',
        unique: true
    })
    slug: string

    @Column({
        type: 'int',
        default: 0
    })
    stock: number

    @Column({
        type: 'text',
        array: true
    })
    sizes: string[]

    @Column('text')
    gender: string

    @Column({
        type: 'text',
        array: true,
        default: []
    })
    tag: string[]

    @OneToMany(
        () => ProductImage,
        (productImage) => productImage.product,
        { cascade: true, eager: true}
    )
    images?: ProductImage[];


    @BeforeInsert()
    @BeforeUpdate()
    checkSlugInsert() {
        if (!this.slug || this.slug === '') {
            this.slug = this.title
        }
        this.slug = this.slug.toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("'", "")
    }
}
