import React from 'react';
import Shimmer from '@magento/venia-ui/lib/components/Shimmer';

const MiniCartShimmer = () => {
    return (
        <>
            <div className="d-flex mb-2">
                <div>
                    <Shimmer height="110px" width="100px" />
                </div>
                <div className="mx-2">
                    <div className="mb-1">
                        <Shimmer height="16px" width="150px" />
                    </div>
                    <div className="mb-2">
                        <Shimmer height="16px" width="130px" />
                    </div>
                    <div className="mb-1">
                        <Shimmer height="12px" width="80px" />
                    </div>
                    <div className="mb-1">
                        <Shimmer height="12px" width="110px" />
                    </div>
                </div>
                <div>
                    <Shimmer height="30px" width="30px" />
                </div>
            </div>
            <div className="d-flex">
                <div>
                    <Shimmer height="110px" width="100px" />
                </div>
                <div className="mx-2">
                    <div className="mb-1">
                        <Shimmer height="16px" width="150px" />
                    </div>
                    <div className="mb-2">
                        <Shimmer height="16px" width="130px" />
                    </div>
                    <div className="mb-1">
                        <Shimmer height="12px" width="80px" />
                    </div>
                    <div className="mb-1">
                        <Shimmer height="12px" width="110px" />
                    </div>
                </div>
                <div>
                    <Shimmer height="30px" width="30px" />
                </div>
            </div>
        </>
    )
}

export default MiniCartShimmer
