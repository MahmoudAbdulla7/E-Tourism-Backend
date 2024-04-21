class ApiFeatures{
    constructor(mongooseQuery,queryData){
        this.mongooseQuery=mongooseQuery ;
        this.queryData=queryData ;
    }
    paginate(){
        const {size,page}=this.queryData;
        if (!page||page<=0) {
            page=1;
        }
        if (!size || size<=0) {
            size=5
        }
        this.mongooseQuery.limit(parseInt(size)).skip(parseInt(page)-1 * parseInt(size))
        return this;
    }
    filter(){
        const excludeQuery =["page","size","fields","search","sort"]
        const filterQuery ={...this.queryData};
        excludeQuery.forEach(param => {
            delete filterQuery[param]
        });
        this.mongooseQuery.find(JSON.parse(JSON.stringify(filterQuery).replace(/(gt|gte|lt|lte|in|nin|eq|neq)/g,match=>`$${match}`)));
        return this;
    }
    sort(){
        this.mongooseQuery.sort(this.queryData.sort?.replaceAll(","," "));
        return this;
    }
    search(){
        this.mongooseQuery.find({$or:
            [{name:{$regex:this.queryData.search ,$options:'i'}},{description:{$regex:this.queryData.search ,$options:'i'}}]})
            return this
    }
    select(){
        this.mongooseQuery.sort(this.queryData.fields?.replaceAll(","," "));
        return this;
    }
}
export default ApiFeatures;